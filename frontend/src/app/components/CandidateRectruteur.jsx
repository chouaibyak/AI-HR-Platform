import React, { useEffect, useState } from 'react'
import { auth } from '../firebase'
import apiApplication from '../services/api/apiApplication'
import apiJob from '../services/api/apiJob'
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'


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

      console.log("Fetching applications for recruiter:", currentUser.uid);

      // Deux méthodes de récupération selon votre préférence
      const response = await apiApplication.get(`/applications/recruiter/${currentUser.uid}`);
      console.log("API response data:", response.data);

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
          matchScore: app.matchScore || 0
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

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700'
    if (score >= 60) return 'bg-blue-100 text-blue-700'
    if (score >= 40) return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'accepted':
        return {
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: <CheckCircle2 className="w-4 h-4" />,
          text: 'Acceptée'
        }
      case 'rejected':
        return {
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: <XCircle className="w-4 h-4" />,
          text: 'Refusée'
        }
      case 'pending':
        return {
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          icon: <Clock className="w-4 h-4" />,
          text: 'En attente'
        }
      default:
        return {
          color: 'text-gray-600 bg-gray-50 border-gray-200',
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20 pl-20">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ml-8 mt-20 mr-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Candidatures reçues</h1>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune candidature</h3>
            <p className="text-gray-500">
              Vous n'avez pas encore reçu de candidatures pour vos offres.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Section des candidatures en attente */}
          <div className="mb-8">
            <div className="grid gap-6">
              {applications
                .filter(candidature => candidature.status === 'pending')
                .map((candidature) => (
                  <div key={candidature.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold">{candidature.job_title}</h3>

                        {/* Section Candidat - clairement identifiée */}
                        <div className="mt-2">
                          <p className="font-medium text-gray-700">Candidat:</p>
                          <p className="text-gray-600">{candidature.candidate_name}</p>
                        </div>

                        {/* Section Job - clairement identifiée */}
                        <div className="mt-2">
                          <p className="font-medium text-gray-700">Offre:</p>
                          <p className="text-gray-600">{candidature.job_title} - {candidature.company}</p>
                        </div>

                        <p className="text-sm text-gray-500 mt-2">
                          Postulé le {formatDate(candidature.created_at)}
                        </p>

                        <div className="mt-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(candidature.matchScore)}`}>
                            Score: {candidature.matchScore}%
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(candidature.id, 'accepted')}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(candidature.id, 'rejected')}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                          Refuser
                        </button>
                        <button
                          onClick={() => window.open(candidature.cv_url, '_blank')}
                          className="text-blue-700 px-4 py-2 rounded underline"
                        >
                          Voir CV
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Section des candidatures traitées */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Candidatures traitées</h2>
            <div className="grid gap-6">
              {applications
                .filter(candidature => candidature.status !== 'pending')
                .map((candidature) => {
                  const statusConfig = getStatusConfig(candidature.status);
                  return (
                    <div key={candidature.id} className="bg-white rounded-lg border p-6">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">{candidature.job_title}</h3>

                          <div className="grid grid-cols-2 gap-4 mt-3">
                            <div>
                              <p className="font-medium text-sm text-gray-500">Candidat</p>
                              <p>{candidature.candidate_name}</p>
                            </div>
                            <div>
                              <p className="font-medium text-sm text-gray-500">Entreprise</p>
                              <p>{candidature.company}</p>
                            </div>
                          </div>

                          <div className="mt-4 flex gap-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${statusConfig.color}`}>
                              {statusConfig.icon}
                              <span className="ml-1.5">{statusConfig.text}</span>
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm ${getScoreColor(candidature.matchScore)}`}>
                              Score: {candidature.matchScore}%
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <button
                            onClick={() => window.open(candidature.cv_url, '_blank')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Voir CV
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}