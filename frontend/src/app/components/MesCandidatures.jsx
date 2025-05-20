import React, { useEffect, useState } from 'react'
import { auth } from '../firebase'
import apiApplication from '../services/api/apiApplication'
import { Trash2, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default function MesCandidatures() {
  const [candidatures, setCandidatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    fetchCandidatures()
  }, [])

  const fetchCandidatures = async () => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        setError("Vous devez être connecté pour voir vos candidatures")
        return
      }

      const response = await apiApplication.get(`/applications/candidate/${currentUser.uid}`)
      setCandidatures(response.data)
    } catch (error) {
      console.error("Erreur lors de la récupération des candidatures:", error)
      setError("Impossible de récupérer vos candidatures. Veuillez réessayer plus tard.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (candidatureId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette candidature ?")) {
      return
    }

    try {
      setDeletingId(candidatureId)
      setDeleteError(null)

      const response = await apiApplication.delete(`/applications/${candidatureId}`)

      if (response.status === 200) {
        setCandidatures(candidatures.filter(c => c.id !== candidatureId))
      } else {
        throw new Error(response.data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      setDeleteError(error.response?.data?.error || "Impossible de supprimer la candidature. Veuillez réessayer.")
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusConfig = (statut) => {
    switch (statut) {
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
      if (isNaN(date.getTime())) {
        console.error("Date invalide:", dateString)
        return 'Date invalide'
      }

      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch (error) {
      console.error("Erreur lors du formatage de la date:", error)
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
      {/* Header fixe */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Mes candidatures
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Gérez vos candidatures et suivez leur statut
        </p>
      </div>

      {/* Message d'erreur de suppression */}
      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-4 mt-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-600">{deleteError}</p>
          </div>
        </div>
      )}

      {/* Contenu scrollable */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {candidatures.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune candidature</h3>
              <p className="text-gray-500">
                Vous n'avez pas encore postulé à aucune offre. Parcourez les offres disponibles pour commencer.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {candidatures.map((candidature) => {
              const statusConfig = getStatusConfig(candidature.status)
              return (
                <div
                  key={candidature.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {candidature.job_title}
                        </h2>
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <span className="truncate">{candidature.company}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDate(candidature.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                            {statusConfig.icon}
                            <span className="ml-1.5">{statusConfig.text}</span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(candidature.id)}
                        disabled={deletingId === candidature.id}
                        className={`ml-4 p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors duration-200 ${deletingId === candidature.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        title="Supprimer la candidature"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}