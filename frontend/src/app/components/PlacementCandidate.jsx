import React, { useEffect, useState } from 'react'
import { auth } from '../firebase'
import apiApplication from '../services/api/apiApplication'
import { CheckCircle2, Award, Building, Calendar, Star } from 'lucide-react'

export default function PlacementCandidate() {
  const [candidatures, setCandidatures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) return

    const loadCandidatures = async () => {
      try {
        console.log("Fetching applications for candidate:", currentUser.uid);
        const response = await apiApplication.get(`/applications/candidate/${currentUser.uid}`)
        console.log("Full response:", response.data);

        // Filtrer uniquement les candidatures acceptées
        const acceptedApplications = response.data
          .filter(app => {
            console.log(`App ID: ${app.id}, Status: ${app.status}`);
            return app.status === 'accepted'
          })
          .map(app => ({
            id: app.id,
            job_id: app.job?.id || app.job_id || '',
            job_title: app.job?.title || app.job_title || 'Sans titre',
            company: app.job?.company || app.company || 'Entreprise inconnue',
            created_at: app.created_at || new Date().toISOString(),
            cv_url: app.cv_url || '',
            status: app.status
          }))

        setCandidatures(acceptedApplications)
      } catch (err) {
        console.error('Erreur de chargement :', err)
        setError("Impossible de récupérer vos candidatures acceptées.")
      } finally {
        setLoading(false)
      }
    }

    loadCandidatures()
  }, [])

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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Chargement de vos placements...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-50">
        <div className="bg-white border border-red-200 rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mes Placements</h1>
              <p className="text-gray-600 mt-1">Félicitations ! Vos candidatures acceptées par les recruteurs</p>
            </div>
          </div>

          {candidatures.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mt-6">
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">
                  {candidatures.length} candidature{candidatures.length > 1 ? 's' : ''} acceptée{candidatures.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-6">
          {candidatures.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">Aucune candidature acceptée</h2>
              <p className="text-gray-500 text-lg max-w-md mx-auto">
                Continuez à postuler aux offres qui vous intéressent. Vos futurs placements apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {candidatures.map(c => (
                <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all duration-300 overflow-hidden">
                  <div className="p-6 sm:p-8">
                    <div className="flex items-start space-x-6">
                      {/* Success Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-7 h-7 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{c.job_title}</h3>

                            <div className="flex items-center space-x-4 text-gray-600 mb-4">
                              <div className="flex items-center space-x-2">
                                <Building className="w-4 h-4" />
                                <span className="font-medium">{c.company}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>Acceptée le {formatDate(c.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="flex-shrink-0 ml-4">
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Candidature Acceptée
                            </span>
                          </div>
                        </div>

                        {/* Bottom Border Accent */}
                        <div className="w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mt-4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}