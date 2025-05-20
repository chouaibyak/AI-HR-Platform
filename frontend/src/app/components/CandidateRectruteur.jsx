import React, { useEffect, useState } from 'react'
import { auth } from '../firebase'
import apiApplication from '../services/api/apiApplication'
import apiJob from '../services/api/apiJob'
import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'


export default function CandidatRecruteur() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchApplications = async () => {
    try {
      setRefreshing(true)
      const currentUser = auth.currentUser
      if (!currentUser) {
        console.error("Aucun utilisateur connecté")
        setError("Vous devez être connecté pour voir les candidatures")
        return
      }

      console.log("\n=== DÉBUT DE LA RÉCUPÉRATION DES CANDIDATURES ===")
      console.log("ID du recruteur:", currentUser.uid)

      // Récupérer les jobs du recruteur
      console.log("1. Récupération des jobs du recruteur...")
      try {
        const jobsResponse = await apiJob.get(`/jobs/recruiter/${currentUser.uid}`)
        console.log("Réponse brute des jobs:", jobsResponse)
        const recruiterJobs = jobsResponse.data
        console.log("Jobs trouvés:", recruiterJobs)

        if (!recruiterJobs || !Array.isArray(recruiterJobs) || recruiterJobs.length === 0) {
          console.log("Aucun job trouvé pour ce recruteur")
          setApplications([])
          setError(null)
          return
        }

        // Récupérer toutes les candidatures
        console.log("2. Récupération des candidatures pour chaque job...")
        const allApplications = []
        for (const job of recruiterJobs) {
          try {
            console.log(`Récupération des candidatures pour le job ${job.id} (${job.title})`)
            const response = await apiApplication.get(`/applications/job/${job.id}`)
            console.log(`Réponse brute pour le job ${job.id}:`, response)
            console.log(`Candidatures trouvées pour le job ${job.id}:`, response.data)

            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              const jobApplications = response.data.map(app => ({
                ...app,
                job_title: job.title,
                company: job.company
              }))
              console.log(`Candidatures enrichies pour le job ${job.id}:`, jobApplications)
              allApplications.push(...jobApplications)
            } else {
              console.log(`Aucune candidature trouvée pour le job ${job.id}`)
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération des candidatures pour le job ${job.id}:`, error)
            if (error.response) {
              console.error("Données d'erreur:", error.response.data)
              console.error("Statut de l'erreur:", error.response.status)
            }
          }
        }

        console.log("3. Total des candidatures trouvées:", allApplications.length)
        console.log("Détail des candidatures:", allApplications)

        if (allApplications.length === 0) {
          console.log("Aucune candidature trouvée")
          setApplications([])
          setError(null)
          return
        }

        // Récupérer les scores de matching pour chaque candidature
        console.log("4. Récupération des scores de matching...")
        const applicationsWithScores = await Promise.all(
          allApplications.map(async (app) => {
            try {
              const cvId = app.cv_url.split('_')[0]
              console.log(`Récupération du score pour CV ${cvId} et job ${app.job_id}`)
              const scoreResponse = await fetch(`http://localhost:5004/match/${cvId}/${app.job_id}`)
              const scoreData = await scoreResponse.json()
              console.log(`Score trouvé pour la candidature ${app.id}:`, scoreData)
              return {
                ...app,
                matchScore: scoreData.match_score || 0
              }
            } catch (error) {
              console.error(`Erreur lors de la récupération du score pour la candidature ${app.id}:`, error)
              return {
                ...app,
                matchScore: 0
              }
            }
          })
        )

        // Trier les candidatures par score décroissant
        const sortedApplications = applicationsWithScores.sort((a, b) => {
          // Si l'une est en attente et l'autre acceptée/refusée, prioriser celle en attente
          if (a.status === 'pending' && (b.status === 'accepted' || b.status === 'rejected')) return -1;
          if ((a.status === 'accepted' || a.status === 'rejected') && b.status === 'pending') return 1;

          // Si les deux sont dans le même état, trier par score
          return b.matchScore - a.matchScore;
        });
        console.log("5. Candidatures triées:", sortedApplications)
        setApplications(sortedApplications)
        setError(null)
      } catch (error) {
        console.error("Erreur lors de la récupération des jobs:", error)
        if (error.response) {
          console.error("Données d'erreur:", error.response.data)
          console.error("Statut de l'erreur:", error.response.status)
        }
        setError("Impossible de récupérer les jobs. Veuillez réessayer plus tard.")
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des candidatures:", error)
      if (error.response) {
        console.error("Données d'erreur:", error.response.data)
        console.error("Statut de l'erreur:", error.response.status)
      }
      setError("Impossible de récupérer les candidatures. Veuillez réessayer plus tard.")
    } finally {
      setLoading(false)
      setRefreshing(false)
      console.log("=== FIN DE LA RÉCUPÉRATION DES CANDIDATURES ===\n")
    }
  }

  // Ajouter un bouton de rafraîchissement
  const handleRefresh = () => {
    fetchApplications();
  };

  // Charger les candidatures au montage du composant et toutes les 30 secondes
  useEffect(() => {
    console.log("Initialisation du composant CandidatRecruteur")
    fetchApplications()

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchApplications, 30000)

    return () => clearInterval(interval)
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
                    <div className="flex justify-between items-start ">
                      <div>
                        <h3 className="text-lg font-semibold">{candidature.job_title}</h3>
                        <p className="text-gray-600">{candidature.candidate_name}</p>
                        <p className="text-sm text-gray-500">
                          Postulé le {formatDate(candidature.created_at)}
                        </p>
                        <div className="mt-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(candidature.matchScore)}`}>
                            Score de matching : {candidature.matchScore}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2  ">
                        <button
                          onClick={() => handleStatusUpdate(candidature.id, 'accepted')}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(candidature.id, 'rejected')}
                          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                          Refuser
                        </button>
                        <button
                          onClick={() => window.open(candidature.cv_url, '_blank')}
                          className=" text-blue-700 px-4 py-2 rounded underline "
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
                    <div
                      key={candidature.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                              {candidature.job_title}
                            </h2>
                            <div className="flex items-center text-sm text-gray-500 mb-4">
                              <span>{candidature.candidate_name}</span>
                              <span className="mx-2">•</span>
                              <span>{formatDate(candidature.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                                {statusConfig.icon}
                                <span className="ml-1.5">{statusConfig.text}</span>
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(candidature.matchScore)}`}>
                                Score de matching : {candidature.matchScore}%
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                const cvData = localStorage.getItem(candidature.cv_url);
                                if (cvData) {
                                  const blob = new Blob([cvData], { type: 'application/pdf' });
                                  const url = URL.createObjectURL(blob);
                                  window.open(url, '_blank');
                                } else {
                                  alert('CV non trouvé dans le stockage local');
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 px-4 py-2"
                            >
                              Voir le CV
                            </button>
                          </div>
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