import React, { useEffect, useState } from 'react';
import { CheckCircle2, User, Briefcase, Calendar, MapPin, Building } from 'lucide-react';
import { auth } from '../firebase';
import apiApplication from '../services/api/apiApplication';

export default function PlacementRecruiter() {
  const [acceptedApplications, setAcceptedApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAcceptedApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Veuillez vous connecter");
        return;
      }

      const response = await apiApplication.get(`/applications/recruiter/${currentUser.uid}`);
      const allApplications = response.data;

      // Filtrer uniquement les applications acceptées
      const accepted = allApplications.filter(app => app.status === 'accepted');
      setAcceptedApplications(accepted);
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      setError("Erreur lors du chargement des placements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcceptedApplications();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-20 ml-8 mr-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-red-800 mb-2">Erreur</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 ml-8 mr-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Placements</h1>
        <p className="text-gray-600">Vos candidatures acceptées</p>
      </div>

      {acceptedApplications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun placement</h3>
          <p className="text-gray-500">
            Vous n'avez pas encore de candidatures acceptées.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {acceptedApplications.map((application) => (
            <div key={application.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="ml-2 font-semibold text-green-600">Accepté</span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800">{application.job?.title}</h3>
                  <p className="text-gray-500 mb-4">{application.job?.company}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start">
                      <User className="flex-shrink-0 w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Candidat</p>
                        <p className="font-medium">{application.candidate?.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Calendar className="flex-shrink-0 w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Date d'acceptation</p>
                        <p className="font-medium">
                          {new Date(application.updated_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <MapPin className="flex-shrink-0 w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Localisation</p>
                        <p className="font-medium">{application.job?.location || 'Non spécifiée'}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Building className="flex-shrink-0 w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Type de contrat</p>
                        <p className="font-medium">{application.job?.contract_type || 'Non spécifié'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col ml-4 space-y-2 min-w-[120px]">
                  <button
                    onClick={() => window.open(application.cv_url, '_blank')}
                    className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
                  >
                    Voir CV
                  </button>
                  <button
                    onClick={() => alert('Planifier un entretien')}
                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
                  >
                    Planifier entretien
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}