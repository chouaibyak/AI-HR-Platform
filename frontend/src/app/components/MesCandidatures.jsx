import React, { useEffect, useState } from 'react'
import { auth } from '../firebase'
import apiApplication from '../services/api/apiApplication'
import {
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'

export default function MesCandidatures() {
  const [candidatures, setCandidatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    let intervalId

    const loadCandidatures = async () => {
      try {
        const response = await apiApplication.get(`/applications/candidate/${currentUser.uid}`)
        const formatted = response.data.map(app => ({
          id: app.id,
          job_id: app.job?.id || app.job_id || '',
          job_title: app.job?.title || app.job_title || 'Sans titre',
          company: app.job?.company || app.company || 'Entreprise inconnue',
          status: app.status || 'pending',
          created_at: app.created_at || new Date().toISOString(),
          cv_url: app.cv_url || ''
        }))
        setCandidatures(formatted)
      } catch (err) {
        console.error('Erreur de chargement :', err)
        setError("Impossible de récupérer vos candidatures.")
      } finally {
        setLoading(false)
      }
    }

    // Appel initial
    loadCandidatures()

    // Mise à jour toutes les 30s
    intervalId = setInterval(loadCandidatures, 30000)

    return () => clearInterval(intervalId)
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette candidature ?')) return

    try {
      setDeletingId(id)
      setDeleteError(null)
      const response = await apiApplication.delete(`/applications/${id}`)

      if (response.status === 200) {
        setCandidatures(prev => prev.filter(c => c.id !== id))
      } else {
        throw new Error('Suppression échouée')
      }
    } catch (err) {
      console.error("Erreur suppression :", err)
      setDeleteError("Impossible de supprimer la candidature. Réessayez.")
    } finally {
      setDeletingId(null)
    }
  }

  const getStatus = (status) => {
    switch (status) {
      case 'accepted':
        return { color: 'text-green-600 bg-green-50 border-green-200', icon: <CheckCircle2 className="w-4 h-4" />, text: 'Acceptée' }
      case 'rejected':
        return { color: 'text-red-600 bg-red-50 border-red-200', icon: <XCircle className="w-4 h-4" />, text: 'Refusée' }
      case 'pending':
        return { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <Clock className="w-4 h-4" />, text: 'En attente' }
      default:
        return { color: 'text-gray-600 bg-gray-50 border-gray-200', icon: <AlertCircle className="w-4 h-4" />, text: 'Statut inconnu' }
    }
  }

  const formatDate = (date) => {
    try {
      const d = new Date(date)
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return 'Date invalide'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-4 mt-20 mb-10">
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Mes candidatures</h1>
        <p className="text-sm text-gray-600">Suivez vos candidatures et leur statut.</p>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-600">{deleteError}</span>
          </div>
        </div>
      )}

      <div className="py-6">
        {candidatures.length === 0 ? (
          <div className="text-center bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Aucune candidature</h2>
            <p className="text-gray-500">Parcourez les offres disponibles pour postuler.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {candidatures.map(c => {
              const status = getStatus(c.status)
              return (
                <div key={c.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
                  <div className="p-4 sm:p-6 flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{c.job_title}</h2>
                      <p className="text-sm text-gray-500">{c.company} • {formatDate(c.created_at)}</p>
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium border ${status.color}`}>
                          {status.icon}
                          <span className="ml-1.5">{status.text}</span>
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className={`ml-4 p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 ${deletingId === c.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      title="Supprimer la candidature"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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
