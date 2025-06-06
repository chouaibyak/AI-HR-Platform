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
import {
  BarChart3,
  PieChart,
  Target,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trophy,
  Calendar,
  Star,
  Award
} from 'lucide-react';

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
          'rgba(16, 185, 129, 0.8)',  // Emerald pour acceptées
          'rgba(239, 68, 68, 0.8)',   // Red pour refusées
          'rgba(245, 158, 11, 0.8)',  // Amber pour en attente
        ],
        borderColor: [
          'rgb(16, 185, 129)',
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
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
          'rgba(99, 102, 241, 0.8)',   // Indigo
          'rgba(34, 197, 94, 0.8)',    // Green
          'rgba(245, 158, 11, 0.8)',   // Amber
          'rgba(239, 68, 68, 0.8)',    // Red
          'rgba(168, 85, 247, 0.8)',   // Purple
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(34, 197, 94)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)',
        ],
        borderWidth: 3,
      },
    ],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex justify-center items-center h-96">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 shadow-lg"></div>
            <p className="mt-4 text-slate-600 font-medium">Génération de votre rapport...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-50">
        <div className="flex items-center justify-center h-96">
          <div className="bg-white/90 backdrop-blur-sm border border-red-200 rounded-2xl p-8 text-center shadow-2xl max-w-md mx-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-3">Erreur de chargement</h2>
            <p className="text-red-600 leading-relaxed">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 shadow-xl border border-slate-200/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Rapport de Candidature
              </h2>
              <p className="text-slate-600">Analysez vos performances et optimisez vos chances</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Statut des candidatures */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Statut des Candidatures</h3>
            </div>

            <div className="mb-6 bg-slate-50 rounded-xl p-4">
              <Bar
                data={applicationStatusData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
                height={200}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-slate-600" />
                  <span className="font-medium">Total des candidatures</span>
                </div>
                <span className="text-xl font-bold text-slate-800">{applications.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-800">Acceptées</span>
                </div>
                <span className="text-xl font-bold text-emerald-600">{getApplicationStats().accepted}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Refusées</span>
                </div>
                <span className="text-xl font-bold text-red-600">{getApplicationStats().rejected}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="font-medium text-amber-800">En attente</span>
                </div>
                <span className="text-xl font-bold text-amber-600">{getApplicationStats().pending}</span>
              </div>
            </div>
          </div>

          {/* Compétences identifiées */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <PieChart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Compétences Identifiées</h3>
            </div>

            <div className="mb-6 bg-slate-50 rounded-xl p-4 flex justify-center">
              <div className="w-64 h-64">
                <Pie
                  data={skillsData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          usePointStyle: true
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-slate-800">Expérience</h4>
              </div>
              <p className="text-slate-700 leading-relaxed">{cvAnalysis?.experience || 'Non spécifiée'}</p>
            </div>
          </div>

          {/* Score de compatibilité */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Score de Compatibilité</h3>
            </div>

            <div className="text-center mb-8">
              <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-20"></div>
                <div className="relative">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {getAverageMatchScore()}%
                  </div>
                </div>
              </div>
              <p className="text-slate-600 font-medium">Score moyen de compatibilité avec les offres</p>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-500" />
                <h4 className="font-bold text-slate-800">Meilleures compatibilités</h4>
              </div>
              <div className="space-y-3">
                {matches.slice(0, 3).map((match, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">{match.job_title || `Offre ${match.job_id}`}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-bold text-green-600">{match.match_score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dernières candidatures */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Dernières Candidatures</h3>
            </div>

            <div className="space-y-4">
              {applications.slice(0, 5).map((app, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-slate-800">{app.job_title}</span>
                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${app.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                      {app.status === 'accepted' ? 'Acceptée' :
                        app.status === 'rejected' ? 'Refusée' :
                          'En attente'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(app.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RapportCandidat;