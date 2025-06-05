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
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Score moyen de matching (%)',
        data: Object.values(jobStats).map(job => job.averageScore),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
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
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
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
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Chargement des données...</span>
      </div>
    );
  }

  // Composant d'erreur
  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="font-medium">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Rapport Recruteur</h2>
        <p className="mt-2 text-gray-600">Tableau de bord des candidatures et analyses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistiques par offre */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Candidatures par Offre</h3>
          {Object.keys(jobStats).length > 0 ? (
            <>
              <div className="h-80 mb-4">
                <Bar data={applicationsByJobData} options={chartOptions} />
              </div>
              <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                {Object.entries(jobStats).map(([job, stats]) => (
                  <div key={job} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="font-medium text-gray-800 truncate" title={job}>
                      {job}
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>Candidatures: <span className="font-semibold">{stats.total}</span></span>
                      <span>Score moyen: <span className="font-semibold">{stats.averageScore}%</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune candidature trouvée</p>
            </div>
          )}
        </div>

        {/* Candidatures par jour */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Candidatures par Jour</h3>
          {Object.keys(dailyStats).length > 0 ? (
            <>
              <div className="h-80 mb-4">
                <Bar data={applicationsByDayData} options={chartOptions} />
              </div>
              <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {Object.entries(dailyStats).map(([date, count]) => (
                  <div key={date} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-b-0">
                    <span className="font-medium text-gray-800">{date}</span>
                    <span className="text-blue-600 font-bold">{count} candidature{count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Aucune candidature trouvée</p>
            </div>
          )}
        </div>

        {/* Meilleurs matchs */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Top 5 Meilleurs Matchs</h3>
          <div className="space-y-3">
            {topMatches.length > 0 ? (
              topMatches.map((match, index) => (
                <div key={`${match.job_id}-${match.candidate_id}-${index}`} className="border-b border-gray-100 pb-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="font-medium text-gray-800 block truncate" title={match.job_title}>
                        {match.job_title || 'Offre sans titre'}
                      </span>
                      <div className="text-sm text-gray-600 mt-1">
                        Candidat: {match.candidate_name || 'Anonyme'}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        #{index + 1}
                      </span>
                      <span className="ml-2 font-bold text-blue-600 text-lg">
                        {match.match_score}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Aucun match trouvé</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Statistiques Globales</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Total des candidatures</span>
              <span className="text-2xl font-bold text-blue-600">{globalStats.totalApplications}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-gray-700">Offres actives</span>
              <span className="text-xl font-bold text-green-600">{globalStats.activeJobs}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-gray-700">Score moyen</span>
              <span className="text-xl font-bold text-purple-600">{globalStats.averageMatchScore}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-gray-700">Candidatures aujourd'hui</span>
              <span className="text-xl font-bold text-orange-600">{globalStats.todayApplications}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RapportRecruiter;