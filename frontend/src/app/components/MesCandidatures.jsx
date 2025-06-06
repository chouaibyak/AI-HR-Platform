import React, { useEffect, useState } from 'react'
import { auth } from '../firebase'
import apiApplication from '../services/api/apiApplication'
import {
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Calendar,
  FileText
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
        return {
          color: 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 shadow-emerald-100',
          icon: <CheckCircle2 className="w-4 h-4" />,
          text: 'Acceptée',
          dot: 'bg-emerald-500'
        }
      case 'rejected':
        return {
          color: 'text-red-700 bg-gradient-to-r from-red-50 to-rose-50 border-red-200 shadow-red-100',
          icon: <XCircle className="w-4 h-4" />,
          text: 'Refusée',
          dot: 'bg-red-500'
        }
      case 'pending':
        return {
          color: 'text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-amber-100',
          icon: <Clock className="w-4 h-4" />,
          text: 'En attente',
          dot: 'bg-amber-500'
        }
      default:
        return {
          color: 'text-slate-700 bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200 shadow-slate-100',
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Statut inconnu',
          dot: 'bg-slate-500'
        }
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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 shadow-lg" />
          <p className="mt-4 text-slate-600 font-medium">Chargement de vos candidatures...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-red-50">
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center shadow-2xl max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-800 mb-3">Oops ! Une erreur s'est produite</h2>
          <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="mx-4 pt-20 pb-10">
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 px-6 py-6 rounded-t-2xl shadow-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Mes candidatures
            </h1>
          </div>
          <p className="text-slate-600 ml-13">Suivez l'évolution de vos candidatures en temps réel</p>
        </div>

        {deleteError && (
          <div className="bg-white/90 backdrop-blur-sm border border-red-200 rounded-xl p-4 mt-4 shadow-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                <AlertCircle className="w-4 h-4 text-red-600" />
              </div>
              <span className="text-red-700 font-medium">{deleteError}</span>
            </div>
          </div>
        )}

        <div className="py-6">
          {candidatures.length === 0 ? (
            <div className="text-center bg-white/80 backdrop-blur-sm border border-slate-200 p-12 rounded-2xl shadow-xl">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Aucune candidature pour le moment</h2>
              <p className="text-slate-500 text-lg">Parcourez les offres disponibles et commencez à postuler dès maintenant !</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {candidatures.map(c => {
                const status = getStatus(c.status)
                return (
                  <div key={c.id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 hover:shadow-2xl hover:border-slate-300/60 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                    <div className="p-6 sm:p-8">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-slate-800 mb-2 leading-tight">{c.job_title}</h2>
                              <div className="flex items-center gap-4 text-slate-500">
                                <span className="flex items-center gap-1.5">
                                  <Building2 className="w-4 h-4" />
                                  {c.company}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(c.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4">
                            <span className={`inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold border shadow-sm ${status.color}`}>
                              <div className={`w-2 h-2 rounded-full ${status.dot} mr-2 animate-pulse`}></div>
                              {status.icon}
                              <span className="ml-2">{status.text}</span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className={`ml-6 p-3 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 ${deletingId === c.id ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg hover:scale-105'
                            }`}
                          title="Supprimer la candidature"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className={`h-1 w-full bg-gradient-to-r ${status.text === 'Acceptée' ? 'from-emerald-400 to-green-500' :
                        status.text === 'Refusée' ? 'from-red-400 to-rose-500' :
                          status.text === 'En attente' ? 'from-amber-400 to-yellow-500' :
                            'from-slate-300 to-gray-400'
                      }`}></div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}