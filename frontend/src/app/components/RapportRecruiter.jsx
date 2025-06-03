import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;

        if (!user) {
          setError('Utilisateur non connecté');
          setLoading(false);
          return;
        }

        // Récupérer les candidatures
        try {
          // Utiliser l'ID du recruteur connecté
          const applicationsResponse = await apiApplication.get(`/applications/recruiter/${user.uid}`);
          console.log('Applications reçues:', applicationsResponse.data);
          setApplications(applicationsResponse.data || []);
        } catch (err) {
          console.error('Erreur lors de la récupération des candidatures:', err);
          setApplications([]);
        }

        // Récupérer les analyses de CV pour les candidats qui ont postulé
        try {
          const candidateIds = applications.map(app => app.candidate_id);
          const cvAnalysesResponse = await apiCV.get(`/analyses/candidates`, {
            params: { candidateIds }
          });
          console.log('Analyses CV reçues:', cvAnalysesResponse.data);
          setCvAnalyses(cvAnalysesResponse.data || []);
        } catch (err) {
          console.error('Erreur lors de la récupération des analyses de CV:', err);
          setCvAnalyses([]);
        }

        // Récupérer les matchs pour les offres du recruteur
        try {
          const matchesResponse = await apiMatching.get(`/matches/recruiter/${user.uid}`);
          console.log('Matches reçus:', matchesResponse.data);
          setMatches(matchesResponse.data || []);
        } catch (err) {
          console.error('Erreur lors de la récupération des matchs:', err);
          setMatches([]);
        }

        setError(null);
      } catch (err) {
        console.error('Erreur générale:', err);
        setError('Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchData();
      } else {
        setLoading(false);
        setError('Veuillez vous connecter pour voir le rapport');
      }
    });

    return () => unsubscribe();
  }, []);

  // Calculer les statistiques des candidatures par offre
  const getApplicationsByJob = () => {
    const jobStats = {};
    applications.forEach(app => {
      if (!jobStats[app.job_title]) {
        jobStats[app.job_title] = {
          total: 0,
          matches: [],
          averageScore: 0
        };
      }
      jobStats[app.job_title].total++;

      // Trouver le match correspondant
      const match = matches.find(m => m.job_id === app.job_id && m.candidate_id === app.candidate_id);
      if (match) {
        jobStats[app.job_title].matches.push(match.match_score);
      }
    });

    // Calculer la moyenne des scores pour chaque offre
    Object.keys(jobStats).forEach(job => {
      const matches = jobStats[job].matches;
      jobStats[job].averageScore = matches.length > 0
        ? Math.round(matches.reduce((a, b) => a + b, 0) / matches.length)
        : 0;
    });

    return jobStats;
  };

  // Calculer les postulations par jour
  const getApplicationsByDay = () => {
    const dailyStats = {};
    applications.forEach(app => {
      const date = new Date(app.created_at).toLocaleDateString();
      dailyStats[date] = (dailyStats[date] || 0) + 1;
    });
    return dailyStats;
  };

  // Données pour le graphique des candidatures par offre
  const applicationsByJobData = {
    labels: Object.keys(getApplicationsByJob()),
    datasets: [
      {
        label: 'Nombre de candidatures',
        data: Object.values(getApplicationsByJob()).map(job => job.total),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        label: 'Score moyen de matching',
        data: Object.values(getApplicationsByJob()).map(job => job.averageScore),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }
    ],
  };

  // Données pour le graphique des candidatures par jour
  const applicationsByDayData = {
    labels: Object.keys(getApplicationsByDay()),
    datasets: [
      {
        label: 'Candidatures par jour',
        data: Object.values(getApplicationsByDay()),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  const jobStats = getApplicationsByJob();
  const dailyStats = getApplicationsByDay();

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Rapport Recruteur</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statistiques par offre */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Candidatures par Offre</h3>
          {Object.keys(jobStats).length > 0 ? (
            <>
              <Bar data={applicationsByJobData} options={chartOptions} />
              <div className="mt-4 space-y-2">
                {Object.entries(jobStats).map(([job, stats]) => (
                  <div key={job} className="border-b pb-2">
                    <div className="font-medium">{job}</div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Candidatures: {stats.total}</span>
                      <span>Score moyen: {stats.averageScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500">Aucune candidature trouvée</p>
          )}
        </div>

        {/* Candidatures par jour */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Candidatures par Jour</h3>
          {Object.keys(dailyStats).length > 0 ? (
            <>
              <Bar data={applicationsByDayData} options={chartOptions} />
              <div className="mt-4 space-y-2">
                {Object.entries(dailyStats).map(([date, count]) => (
                  <div key={date} className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">{date}</span>
                    <span className="text-blue-600 font-bold">{count} candidatures</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500">Aucune candidature trouvée</p>
          )}
        </div>

        {/* Meilleurs matchs */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Meilleurs Matchs</h3>
          <div className="space-y-3">
            {matches.length > 0 ? (
              matches
                .sort((a, b) => b.match_score - a.match_score)
                .slice(0, 5)
                .map((match, index) => (
                  <div key={index} className="border-b pb-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{match.job_title}</span>
                      <span className="font-bold text-blue-600">{match.match_score}%</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Candidat: {match.candidate_name || 'Anonyme'}
                    </div>
                  </div>
                ))
            ) : (
              <p className="text-gray-500">Aucun match trouvé</p>
            )}
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Statistiques Globales</h3>
          <div className="space-y-4">
            <div className="text-lg font-medium">
              Total des candidatures: {applications.length}
            </div>
            <div className="text-sm text-gray-600">
              Nombre d'offres actives: {Object.keys(jobStats).length}
            </div>
            <div className="text-sm text-gray-600">
              Score de matching moyen: {
                Math.round(
                  matches.reduce((acc, curr) => acc + curr.match_score, 0) / matches.length
                ) || 0
              }%
            </div>
            <div className="text-sm text-gray-600">
              Candidatures aujourd'hui: {
                dailyStats[new Date().toLocaleDateString()] || 0
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RapportRecruiter;
