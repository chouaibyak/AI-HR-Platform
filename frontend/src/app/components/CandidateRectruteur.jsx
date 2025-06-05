import React, { useEffect, useState } from 'react'
import { auth } from '../firebase'
import apiApplication from '../services/api/apiApplication'
import apiJob from '../services/api/apiJob'
import {
  get_recruiter_applications,
  updatApplicationStatus
} from '../services/api/apiApplication'
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, Eye, User, Building2, Calendar, TrendingUp } from 'lucide-react'

export default function CandidatRecruteur() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Veuillez vous connecter");
        setLoading(false);
        return;
      }

      // Deux méthodes de récupération selon votre préférence
      const response = await apiApplication.get(`/applications/recruiter/${currentUser.uid}`);

      // Transformation des données pour s'assurer que tous les champs requis existent
      const validatedData = response.data.map(app => {
        // Debug: Afficher la structure complète de l'application
        console.log("Raw application data:", app);

        return {
          id: app.id,
          job_id: app.job?.id || app.job_id || "",
          job_title: app.job?.title || app.job_title || "Titre non spécifié",
          candidate_name: app.candidate?.name || app.candidate_name || "Candidat inconnu",
          company: app.job?.company || app.company || "Entreprise non spécifiée",
          status: app.status || "pending",
          cv_url: app.cv_url || "",
          created_at: app.created_at || new Date().toISOString(),
          matchScore: app.match_score || app.matchScore || 0
        };
      });

      console.log("Validated data:", validatedData);
      setApplications(validatedData);

    } catch (error) {
      console.error("Detailed error:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      setError("Erreur lors du chargement des candidatures");
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un bouton de rafraîchissement
  const handleRefresh = () => {
    fetchApplications();
  };

  // Charger les candidatures au montage du composant et toutes les 30 secondes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchApplications();
      } else {
        setError("Utilisateur non authentifié");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [])

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      console.log(`Mise à jour du statut de la candidature ${applicationId} vers ${newStatus}`);

      const response = await apiApplication.put(`/applications/${applicationId}/status`, {
        status: newStatus
      });

      if (response.status === 200) {
        // Mettre à jour l'état local
        setApplications(applications.map(app =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        ));

        // Afficher un message de confirmation
        alert(`Candidature ${newStatus === 'accepted' ? 'acceptée' : 'refusée'} avec succès`);

        // Rafraîchir les données
        await fetchApplications();
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      alert("Erreur lors de la mise à jour du statut. Veuillez réessayer.");
    }
  };

  const handleViewCV = (cvUrl) => {
    // Extrait seulement la partie UUID du nom complet
    const uuidPart = cvUrl.split('_')[0]; // Prend tout avant le premier '_'
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    window.open(`${apiUrl}/cv/view/${uuidPart}`, '_blank');
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-green-500/25'
    if (score >= 60) return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
    if (score >= 40) return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
    return 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg shadow-gray-500/25'
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'accepted':
        return {
          color: 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 shadow-sm',
          icon: <CheckCircle2 className="w-4 h-4" />,
          text: 'Acceptée'
        }
      case 'rejected':
        return {
          color: 'text-red-700 bg-gradient-to-r from-red-50 to-rose-50 border-red-200 shadow-sm',
          icon: <XCircle className="w-4 h-4" />,
          text: 'Refusée'
        }
      case 'pending':
        return {
          color: 'text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-sm',
          icon: <Clock className="w-4 h-4" />,
          text: 'En attente'
        }
      default:
        return {
          color: 'text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200 shadow-sm',
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'En attente'
        }
    }
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Date non disponible'
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch (error) {
      return 'Date invalide'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20 pl-30">
        <div className="text-center">
          <div className="relative ml-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des candidatures...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20 pl-20">
        <div className="bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 border-2 border-red-200 rounded-xl p-8 max-w-md text-center shadow-xl">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">Oops ! Une erreur est survenue</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const pendingApplications = applications.filter(candidature => candidature.status === 'pending');
  const processedApplications = applications.filter(candidature => candidature.status !== 'pending');

  return (
    <div className="ml-8 mt-20 mr-8 mb-8">
      {/* Header avec statistiques */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Candidatures reçues
            </h1>
            <p className="text-gray-600 mt-1">Gérez vos candidatures en temps réel</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total candidatures</p>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
              <div className="bg-blue-400 bg-opacity-30 p-3 rounded-lg">
                <User className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">En attente</p>
                <p className="text-2xl font-bold">{pendingApplications.length}</p>
              </div>
              <div className="bg-amber-400 bg-opacity-30 p-3 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Traitées</p>
                <p className="text-2xl font-bold">{processedApplications.length}</p>
              </div>
              <div className="bg-emerald-400 bg-opacity-30 p-3 rounded-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune candidature pour le moment</h3>
            <p className="text-gray-600 text-lg">
              Vos futures candidatures apparaîtront ici. Restez patient, les talents arrivent !
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section des candidatures en attente */}
          {pendingApplications.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 rounded-full w-3 h-3"></div>
                <h2 className="text-2xl font-bold text-gray-800">Candidatures en attente</h2>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {pendingApplications.length}
                </span>
              </div>

              <div className="grid gap-6">
                {pendingApplications.map((candidature) => (
                  <div key={candidature.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2"></div>
                    <div className="p-8">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{candidature.job_title}</h3>
                            <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${getScoreColor(candidature.matchScore)}`}>
                              <TrendingUp className="w-4 h-4" />
                              {candidature.matchScore}%
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                              <div className="bg-blue-100 rounded-lg p-2">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Candidat</p>
                                <p className="font-semibold text-gray-900">{candidature.candidate_name}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                              <div className="bg-purple-100 rounded-lg p-2">
                                <Building2 className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-500">Entreprise</p>
                                <p className="font-semibold text-gray-900">{candidature.company}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">Postulé le {formatDate(candidature.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 ml-6">
                          <button
                            onClick={() => handleStatusUpdate(candidature.id, 'accepted')}
                            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Accepter
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(candidature.id, 'rejected')}
                            className="bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Refuser
                          </button>
                          <button
                            onClick={() => handleViewCV(candidature.cv_url)}
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Voir CV
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section des candidatures traitées */}
          {processedApplications.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-500 rounded-full w-3 h-3"></div>
                <h2 className="text-2xl font-bold text-gray-800">Candidatures traitées</h2>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {processedApplications.length}
                </span>
              </div>

              <div className="grid gap-4">
                {processedApplications.map((candidature) => {
                  const statusConfig = getStatusConfig(candidature.status);
                  return (
                    <div key={candidature.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-bold text-gray-900">{candidature.job_title}</h3>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                              {statusConfig.icon}
                              <span className="ml-2">{statusConfig.text}</span>
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(candidature.matchScore)}`}>
                              {candidature.matchScore}%
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Candidat</p>
                              <p className="font-semibold text-gray-900">{candidature.candidate_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Entreprise</p>
                              <p className="font-semibold text-gray-900">{candidature.company}</p>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewCV(candidature.cv_url)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Voir CV
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}