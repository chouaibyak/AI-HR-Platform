import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import apiApplication from '../services/api/apiApplication';
import apiMatching from '../services/api/apiMatching';
import apiCV from '../services/api/apiCV';
import { auth } from '../firebase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RapportRecruiter = () => {
  const [applications, setApplications] = useState([]);
  const [matches, setMatches] = useState([]);
  const [cvAnalyses, setCvAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour récupérer les candidatures
  const fetchApplications = useCallback(async (userId) => {
    try {
      const applicationsResponse = await apiApplication.get(`/applications/recruiter/${userId}`);
      console.log('Applications reçues:', applicationsResponse.data);
      return applicationsResponse.data || [];
    } catch (err) {
      console.error('Erreur lors de la récupération des candidatures:', err);
      return [];
    }
  }, []);

  // Fonction pour récupérer les analyses CV
  const fetchCvAnalyses = useCallback(async (candidateIds) => {
    if (!candidateIds || candidateIds.length === 0) return [];

    try {
      const cvAnalysesResponse = await apiCV.get(`/analyses/candidates`, {
        params: { candidateIds }
      });
      console.log('Analyses CV reçues:', cvAnalysesResponse.data);
      return cvAnalysesResponse.data || [];
    } catch (err) {
      console.error('Erreur lors de la récupération des analyses de CV:', err);
      return [];
    }
  }, []);

  // Fonction pour récupérer les matchs
  const fetchMatches = useCallback(async (userId) => {
    try {
      const matchesResponse = await apiMatching.get(`/matches/recruiter/${userId}`);
      console.log('Matches reçus:', matchesResponse.data);
      return matchesResponse.data || [];
    } catch (err) {
      console.error('Erreur lors de la récupération des matchs:', err);
      return [];
    }
  }, []);

  // Fonction principale pour récupérer toutes les données
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        setError('Utilisateur non connecté');
        return;
      }

      // Récupérer les candidatures
      const applicationsData = await fetchApplications(user.uid);
      setApplications(applicationsData);

      // Récupérer les analyses CV pour les candidats qui ont postulé
      const candidateIds = applicationsData.map(app => app.candidate_id);
      const cvAnalysesData = await fetchCvAnalyses(candidateIds);
      setCvAnalyses(cvAnalysesData);

      // Récupérer les matchs
      const matchesData = await fetchMatches(user.uid);
      setMatches(matchesData);

    } catch (err) {
      console.error('Erreur générale:', err);
      setError('Une erreur est survenue lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [fetchApplications, fetchCvAnalyses, fetchMatches]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchData();
      } else {
        setLoading(false);
        setError('Veuillez vous connecter pour voir le rapport');
      }
    });

    return () => unsubscribe();
  }, [fetchData]);

  // Calculer les statistiques des candidatures par offre (memoized)
  const jobStats = useMemo(() => {
    const stats = {};

    applications.forEach(app => {
      const jobTitle = app.job_title || 'Offre sans titre';

      if (!stats[jobTitle]) {
        stats[jobTitle] = {
          total: 0,
          matches: [],
          averageScore: 0
        };
      }
      stats[jobTitle].total++;

      // Trouver le match correspondant
      const match = matches.find(m =>
        m.job_id === app.job_id && m.candidate_id === app.candidate_id
      );
      if (match && typeof match.match_score === 'number') {
        stats[jobTitle].matches.push(match.match_score);
      }
    });

    // Calculer la moyenne des scores pour chaque offre
    Object.keys(stats).forEach(job => {
      const matchScores = stats[job].matches;
      stats[job].averageScore = matchScores.length > 0
        ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
        : 0;
    });

    return stats;
  }, [applications, matches]);

  // Calculer les postulations par jour (memoized)
  const dailyStats = useMemo(() => {
    const stats = {};

    applications.forEach(app => {
      if (app.created_at) {
        const date = new Date(app.created_at).toLocaleDateString('fr-FR');
        stats[date] = (stats[date] || 0) + 1;
      }
    });

    // Trier les dates
    const sortedStats = {};
    Object.keys(stats)
      .sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')))
      .forEach(date => {
        sortedStats[date] = stats[date];
      });

    return sortedStats;
  }, [applications]);

  // Données pour le graphique des candidatures par offre (memoized)
  const applicationsByJobData = useMemo(() => ({
    labels: Object.keys(jobStats),
    datasets: [
      {
        label: 'Nombre de candidatures',
        data: Object.values(jobStats).map(job => job.total),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: 'Score moyen de matching (%)',
        data: Object.values(jobStats).map(job => job.averageScore),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ],
  }), [jobStats]);

  // Données pour le graphique des candidatures par jour (memoized)
  const applicationsByDayData = useMemo(() => ({
    labels: Object.keys(dailyStats),
    datasets: [
      {
        label: 'Candidatures par jour',
        data: Object.values(dailyStats),
        backgroundColor: 'rgba(244, 63, 94, 0.8)',
        borderColor: 'rgba(244, 63, 94, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }
    ],
  }), [dailyStats]);

  // Meilleurs matchs triés (memoized)
  const topMatches = useMemo(() => {
    return matches
      .filter(match => match.match_score && typeof match.match_score === 'number')
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5);
  }, [matches]);

  // Statistiques globales (memoized)
  const globalStats = useMemo(() => {
    const totalApplications = applications.length;
    const activeJobs = Object.keys(jobStats).length;
    const averageMatchScore = matches.length > 0
      ? Math.round(matches.reduce((acc, curr) => acc + (curr.match_score || 0), 0) / matches.length)
      : 0;
    const todayApplications = dailyStats[new Date().toLocaleDateString('fr-FR')] || 0;

    return {
      totalApplications,
      activeJobs,
      averageMatchScore,
      todayApplications
    };
  }, [applications.length, jobStats, matches, dailyStats]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            size: 13,
            weight: '600'
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 12
      },
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
            weight: '500'
          }
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  }), []);

  // Composant de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent absolute top-0"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Chargement en cours</h3>
              <p className="text-gray-600">Récupération des données...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Composant d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex justify-center items-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-red-200 max-w-md w-full">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="bg-red-100 rounded-full p-3">
                <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Erreur</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="p-6 max-w-7xl mx-auto pt-24">
        {/* En-tête avec gradient */}
        <div className="mb-8 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Rapport Recruteur
            </h2>
            <p className="mt-3 text-gray-600 text-lg">Tableau de bord des candidatures et analyses</p>
            <div className="mt-4 h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Statistiques par offre */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Candidatures par Offre</h3>
            </div>
            {Object.keys(jobStats).length > 0 ? (
              <>
                <div className="h-80 mb-6">
                  <Bar data={applicationsByJobData} options={chartOptions} />
                </div>
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {Object.entries(jobStats).map(([job, stats]) => (
                    <div key={job} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 hover:shadow-md transition-all duration-200">
                      <div className="font-semibold text-gray-800 truncate mb-2" title={job}>
                        {job}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-medium">
                          {stats.total} candidature{stats.total > 1 ? 's' : ''}
                        </span>
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                          Score: {stats.averageScore}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Aucune candidature trouvée</p>
              </div>
            )}
          </div>

          {/* Candidatures par jour */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Candidatures par Jour</h3>
            </div>
            {Object.keys(dailyStats).length > 0 ? (
              <>
                <div className="h-80 mb-6">
                  <Bar data={applicationsByDayData} options={chartOptions} />
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {Object.entries(dailyStats).map(([date, count]) => (
                    <div key={date} className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-100 hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">{date}</span>
                        <span className="bg-rose-100 text-rose-800 px-3 py-1 rounded-full font-bold">
                          {count} candidature{count > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Aucune candidature trouvée</p>
              </div>
            )}
          </div>

          {/* Meilleurs matchs */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Top 5 Meilleurs Matchs</h3>
            </div>
            <div className="space-y-4">
              {topMatches.length > 0 ? (
                topMatches.map((match, index) => (
                  <div key={`${match.job_id}-${match.candidate_id}-${index}`} className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                              index === 1 ? 'bg-gray-400' :
                                index === 2 ? 'bg-amber-600' : 'bg-emerald-500'
                            }`}>
                            {index + 1}
                          </span>
                          <span className="font-semibold text-gray-800 truncate" title={match.job_title}>
                            {match.job_title || 'Offre sans titre'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Candidat: {match.candidate_name || 'Anonyme'}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-2 rounded-full font-bold text-lg">
                          {match.match_score}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">Aucun match trouvé</p>
                </div>
              )}
            </div>
          </div>

          {/* Statistiques globales */}
          <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Statistiques Globales</h3>
            </div>
            <div className="space-y-4">
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total des candidatures</p>
                      <p className="text-3xl font-bold">{globalStats.totalApplications}</p>
                    </div>
                    <div className="bg-white/20 rounded-full p-3">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Offres actives</p>
                      <p className="text-3xl font-bold">{globalStats.activeJobs}</p>
                    </div>
                    <div className="bg-white/20 rounded-full p-3">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Score moyen</p>
                      <p className="text-3xl font-bold">{globalStats.averageMatchScore}%</p>
                    </div>
                    <div className="bg-white/20 rounded-full p-3">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Candidatures aujourd'hui</p>
                      <p className="text-3xl font-bold">{globalStats.todayApplications}</p>
                    </div>
                    <div className="bg-white/20 rounded-full p-3">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RapportRecruiter;