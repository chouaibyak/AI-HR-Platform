import React, { useEffect, useState } from 'react'
import { auth } from '../firebase'
import apiApplication from '../services/api/apiApplication'
import apiJob from '../services/api/apiJob'
import {
  get_recruiter_applications,
  updatApplicationStatus
} from '../services/api/apiApplication'
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw, Eye, User, Building2, Calendar, TrendingUp, Sparkles, Award, Target } from 'lucide-react'

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
          skills: app.skills || [],
          summary: app.summary || "",
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
    if (score >= 80) return 'bg-gradient-to-br from-emerald-400 via-green-500 to-emerald-600 text-white shadow-2xl shadow-emerald-500/40 border border-emerald-300/30'
    if (score >= 60) return 'bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600 text-white shadow-2xl shadow-blue-500/40 border border-blue-300/30'
    if (score >= 40) return 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-white shadow-2xl shadow-amber-500/40 border border-amber-300/30'
    return 'bg-gradient-to-br from-gray-400 via-slate-500 to-gray-600 text-white shadow-2xl shadow-gray-500/40 border border-gray-300/30'
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'accepted':
        return {
          color: 'text-emerald-800 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 border-2 border-emerald-200/60 shadow-lg shadow-emerald-500/10 backdrop-blur-sm',
          icon: <CheckCircle2 className="w-4 h-4" />,
          text: 'Acceptée'
        }
      case 'rejected':
        return {
          color: 'text-red-800 bg-gradient-to-br from-red-50 via-rose-50 to-red-100 border-2 border-red-200/60 shadow-lg shadow-red-500/10 backdrop-blur-sm',
          icon: <XCircle className="w-4 h-4" />,
          text: 'Refusée'
        }
      case 'pending':
        return {
          color: 'text-amber-800 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 border-2 border-amber-200/60 shadow-lg shadow-amber-500/10 backdrop-blur-sm',
          icon: <Clock className="w-4 h-4" />,
          text: 'En attente'
        }
      default:
        return {
          color: 'text-gray-800 bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 border-2 border-gray-200/60 shadow-lg shadow-gray-500/10 backdrop-blur-sm',
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
      <div className="flex items-center justify-center min-h-screen pt-20 pl-20 bg-gradient-to-br from-red-50 via-rose-50 to-pink-100">
        <div className="bg-gradient-to-br from-white via-red-50 to-rose-50 border-2 border-red-200/60 rounded-3xl p-10 max-w-md text-center shadow-2xl shadow-red-500/20 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-red-100 to-rose-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-red-800 mb-3">Oops ! Une erreur est survenue</h3>
          <p className="text-red-600 mb-6 text-lg">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
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
    <div className="ml-8 mt-20 mr-8 mb-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header avec statistiques */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <div className="relative">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent mb-2">
              Candidatures reçues
            </h1>
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-30 animate-pulse"></div>
            <p className="text-gray-600 text-lg font-medium">Gérez vos candidatures en temps réel</p>
            <div className="absolute -bottom-1 left-0 w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 transform backdrop-blur-sm border border-blue-500/20"
          >
            <RefreshCw className="w-5 h-5" />
            Actualiser
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/30 border border-blue-400/30 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider">Total candidatures</p>
                <p className="text-3xl font-bold mt-2">{applications.length}</p>
                <div className="flex items-center mt-2 text-blue-200">
                  <Sparkles className="w-4 h-4 mr-1" />
                  <span className="text-xs">Toutes vos opportunités</span>
                </div>
              </div>
              <div className="bg-blue-400/30 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-blue-300/30">
                <User className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 rounded-2xl p-8 text-white shadow-2xl shadow-amber-500/30 border border-amber-400/30 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-semibold uppercase tracking-wider">En attente</p>
                <p className="text-3xl font-bold mt-2">{pendingApplications.length}</p>
                <div className="flex items-center mt-2 text-amber-200">
                  <Target className="w-4 h-4 mr-1" />
                  <span className="text-xs">Action requise</span>
                </div>
              </div>
              <div className="bg-amber-400/30 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-amber-300/30">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl p-8 text-white shadow-2xl shadow-emerald-500/30 border border-emerald-400/30 backdrop-blur-sm hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider">Traitées</p>
                <p className="text-3xl font-bold mt-2">{processedApplications.length}</p>
                <div className="flex items-center mt-2 text-emerald-200">
                  <Award className="w-4 h-4 mr-1" />
                  <span className="text-xs">Décisions prises</span>
                </div>
              </div>
              <div className="bg-emerald-400/30 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-emerald-300/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-100 rounded-3xl shadow-2xl border-2 border-blue-200/60 p-16 text-center backdrop-blur-sm">
          <div className="max-w-lg mx-auto">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-8 shadow-xl border border-blue-200/60">
              <AlertCircle className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Aucune candidature pour le moment</h3>
            <p className="text-gray-600 text-xl leading-relaxed">
              Vos futures candidatures apparaîtront ici. Restez patient, les talents arrivent !
            </p>
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Section des candidatures en attente */}
          {pendingApplications.length > 0 && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-full w-4 h-4 shadow-lg"></div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Candidatures en attente
                </h2>
                <span className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 px-4 py-2 rounded-full text-sm font-bold border border-amber-200/60 shadow-lg">
                  {pendingApplications.length}
                </span>
              </div>

              <div className="grid gap-8">
                {pendingApplications.map((candidature) => (
                  <div key={candidature.id} className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-3xl shadow-2xl border-2 border-blue-200/40 overflow-hidden hover:shadow-3xl transition-all duration-500 hover:-translate-y-2 transform backdrop-blur-sm group">
                    <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-700 h-2"></div>
                    <div className="p-10">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">{candidature.job_title}</h3>
                            <span className={`px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 transform hover:scale-105 transition-transform duration-200 ${getScoreColor(candidature.matchScore)}`}>
                              <TrendingUp className="w-5 h-5" />
                              {candidature.matchScore}% Match
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div className="flex items-center gap-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200/60 shadow-lg backdrop-blur-sm">
                              <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-3 shadow-lg border border-blue-200/60">
                                <User className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Candidat</p>
                                <p className="font-bold text-gray-900 text-lg">{candidature.candidate_name}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-2xl p-6 border border-gray-200/60 shadow-lg backdrop-blur-sm">
                              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-3 shadow-lg border border-purple-200/60">
                                <Building2 className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Entreprise</p>
                                <p className="font-bold text-gray-900 text-lg">{candidature.company}</p>
                              </div>
                            </div>
                          </div>

                          {/* Section Compétences */}
                          <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Compétences clés:</h4>
                            <div className="flex flex-wrap gap-3">
                              {candidature.skills?.map((skill, index) => (
                                <span key={index} className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-200/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Section Résumé */}
                          <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">Résumé du profil:</h4>
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200/60 shadow-lg backdrop-blur-sm">
                              <p className="text-gray-700 leading-relaxed">
                                {candidature.summary || "Aucun résumé disponible"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-gray-500">
                            <div className="bg-gray-100 rounded-lg p-2">
                              <Calendar className="w-5 h-5 text-gray-600" />
                            </div>
                            <span className="font-medium">Postulé le {formatDate(candidature.created_at)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-4 ml-8">
                          <button
                            onClick={() => handleStatusUpdate(candidature.id, 'accepted')}
                            className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center gap-3 transform hover:scale-105 hover:-translate-y-1"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            Accepter
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(candidature.id, 'rejected')}
                            className="bg-gradient-to-r from-gray-400 via-slate-500 to-gray-600 hover:from-gray-500 hover:via-slate-600 hover:to-gray-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center gap-3 transform hover:scale-105 hover:-translate-y-1"
                          >
                            <XCircle className="w-5 h-5" />
                            Refuser
                          </button>
                          <button
                            onClick={() => handleViewCV(candidature.cv_url)}
                            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center gap-3 transform hover:scale-105 hover:-translate-y-1"
                          >
                            <Eye className="w-5 h-5" />
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
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-4 h-4 shadow-lg"></div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Candidatures traitées
                </h2>
                <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full text-sm font-bold border border-green-200/60 shadow-lg">
                  {processedApplications.length}
                </span>
              </div>

              <div className="grid gap-6">
                {processedApplications.map((candidature) => {
                  const statusConfig = getStatusConfig(candidature.status);
                  return (
                    <div key={candidature.id} className="bg-gradient-to-br from-white via-gray-50/50 to-blue-50/30 rounded-2xl shadow-xl border-2 border-gray-200/40 p-8 hover:shadow-2xl transition-all duration-400 hover:-translate-y-1 transform backdrop-blur-sm group">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-xl font-bold text-gray-900">{candidature.job_title}</h3>
                            <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border-2 ${statusConfig.color}`}>
                              {statusConfig.icon}
                              <span className="ml-2">{statusConfig.text}</span>
                            </span>
                            <span className={`px-4 py-2 rounded-xl text-xs font-bold transform hover:scale-105 transition-transform duration-200 ${getScoreColor(candidature.matchScore)}`}>
                              {candidature.matchScore}%
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Candidat</p>
                              <p className="font-bold text-gray-900 text-lg">{candidature.candidate_name}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Entreprise</p>
                              <p className="font-bold text-gray-900 text-lg">{candidature.company}</p>
                            </div>
                          </div>
                        </div>

                        <div className="ml-8">
                          <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Compétences:</h4>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {candidature.skills?.slice(0, 5).map((skill, index) => (
                              <span key={index} className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 px-3 py-1 rounded-lg text-xs font-semibold border border-blue-200/60 shadow-sm">
                                {skill}
                              </span>
                            ))}
                            {candidature.skills?.length > 5 && (
                              <span className="text-xs text-gray-500 font-semibold">+{candidature.skills.length - 5} autres</span>
                            )}
                          </div>

                          <button
                            onClick={() => handleViewCV(candidature.cv_url)}
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-3 border-2 border-blue-200/60 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <Eye className="w-5 h-5" />
                            Voir CV
                          </button>
                        </div>
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