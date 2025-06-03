import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import apiApplication from '../services/api/apiApplication';
import apiMatching from '../services/api/apiMatching';
import apiCV from '../services/api/apiCV';
import { auth } from '../firebase';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const RapportCandidat = () => {
  const [applications, setApplications] = useState([]);
  const [matches, setMatches] = useState([]);
  const [cvAnalysis, setCvAnalysis] = useState(null);
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

        // Récupérer les candidatures du candidat
        try {
          const applicationsResponse = await apiApplication.get(`/applications/candidate/${user.uid}`);
          setApplications(applicationsResponse.data || []);
        } catch (err) {
          console.error('Erreur lors de la récupération des candidatures:', err);
          setApplications([]);
        }

        // Récupérer l'analyse du CV
        try {
          const cvAnalysisResponse = await apiCV.get(`/analyses/${user.uid}`);
          setCvAnalysis(cvAnalysisResponse.data || null);
        } catch (err) {
          console.error('Erreur lors de la récupération de l\'analyse du CV:', err);
          setCvAnalysis(null);
        }

        // Récupérer les matchs pour toutes les offres
        if (cvAnalysis) {
          try {
            const matchesResponse = await apiMatching.get(`/match_all_jobs/${cvAnalysis.id}`);
            setMatches(matchesResponse.data || []);
          } catch (err) {
            console.error('Erreur lors de la récupération des matchs:', err);
            setMatches([]);
          }
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
        setError('Veuillez vous connecter pour voir votre rapport');
      }
    });

    return () => unsubscribe();
  }, []);

  // Calculer les statistiques des candidatures
  const getApplicationStats = () => {
    const accepted = applications.filter(app => app.status === 'accepted').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    const pending = applications.filter(app => app.status === 'pending').length;
    return { accepted, rejected, pending };
  };

  // Calculer la moyenne des scores de compatibilité
  const getAverageMatchScore = () => {
    if (matches.length === 0) return 0;
    const total = matches.reduce((sum, match) => sum + match.match_score, 0);
    return Math.round(total / matches.length);
  };

  // Données pour le graphique en barres (statut des candidatures)
  const applicationStatusData = {
    labels: ['Acceptées', 'Refusées', 'En attente'],
    datasets: [
      {
        label: 'Nombre de candidatures',
        data: [
          getApplicationStats().accepted,
          getApplicationStats().rejected,
          getApplicationStats().pending
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',  // Vert pour acceptées
          'rgba(255, 99, 132, 0.5)',  // Rouge pour refusées
          'rgba(255, 206, 86, 0.5)',  // Jaune pour en attente
        ],
      },
    ],
  };

  // Données pour le graphique circulaire (compétences)
  const skillsData = {
    labels: cvAnalysis?.skills?.slice(0, 5) || ['Aucune compétence identifiée'],
    datasets: [
      {
        data: cvAnalysis?.skills?.slice(0, 5).map(() => 20) || [100],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      },
    ],
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

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Rapport de Candidature</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statut des candidatures */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Statut des Candidatures</h3>
          <Bar data={applicationStatusData} />
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span>Total des candidatures</span>
              <span className="font-bold">{applications.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Acceptées</span>
              <span className="font-bold text-green-600">{getApplicationStats().accepted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Refusées</span>
              <span className="font-bold text-red-600">{getApplicationStats().rejected}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>En attente</span>
              <span className="font-bold text-yellow-600">{getApplicationStats().pending}</span>
            </div>
          </div>
        </div>

        {/* Compétences identifiées */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Compétences Identifiées</h3>
          <Pie data={skillsData} />
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Expérience</h4>
            <p className="text-gray-600">{cvAnalysis?.experience || 'Non spécifiée'}</p>
          </div>
        </div>

        {/* Score de compatibilité */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Score de Compatibilité</h3>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {getAverageMatchScore()}%
            </div>
            <p className="text-gray-600">Score moyen de compatibilité avec les offres</p>
          </div>
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Meilleures compatibilités</h4>
            <div className="space-y-2">
              {matches.slice(0, 3).map((match, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span>{match.job_title || `Offre ${match.job_id}`}</span>
                  <span className="font-bold">{match.match_score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dernières candidatures */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Dernières Candidatures</h3>
          <div className="space-y-3">
            {applications.slice(0, 5).map((app, index) => (
              <div key={index} className="border-b pb-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{app.job_title}</span>
                  <span className={`px-2 py-1 rounded text-sm ${app.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                    {app.status === 'accepted' ? 'Acceptée' :
                      app.status === 'rejected' ? 'Refusée' :
                        'En attente'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(app.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RapportCandidat;
