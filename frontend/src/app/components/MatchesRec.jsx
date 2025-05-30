import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, User, Briefcase, FileText, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { auth } from '../firebase';
import apiApplication from '../services/api/apiApplication';

export default function MatchesRec() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = async () => {
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

      // Filtrer les applications traitées (acceptées ou refusées)
      const processedApps = allApplications.filter(app =>
        ['accepted', 'rejected'].includes(app.status)
      );

      setApplications(processedApps);
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      setError("Erreur lors du chargement des matches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
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
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Erreur</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchMatches}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center mx-auto"
          >
            <RefreshCw className="mr-2" size={16} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const acceptedApps = applications.filter(app => app.status === 'accepted');
  const rejectedApps = applications.filter(app => app.status === 'rejected');

  return (
    <div className="mt-20 ml-8 mr-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Matches</h1>
          <p className="text-gray-600">Vos candidatures traitées</p>
        </div>
        <button
          onClick={fetchMatches}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="mr-1" size={16} />
          Actualiser
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun match</h3>
          <p className="text-gray-500">
            Vous n'avez pas encore traité de candidatures.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Section Acceptées */}
          {acceptedApps.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                Candidatures acceptées ({acceptedApps.length})
              </h2>
              <div className="grid gap-6">
                {acceptedApps.map((app) => (
                  <ApplicationCard key={app.id} application={app} status="accepted" />
                ))}
              </div>
            </div>
          )}

          {/* Section Refusées */}
          {rejectedApps.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                Candidatures refusées ({rejectedApps.length})
              </h2>
              <div className="grid gap-6">
                {rejectedApps.map((app) => (
                  <ApplicationCard key={app.id} application={app} status="rejected" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ application, status }) {
  const statusConfig = {
    accepted: {
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      text: 'Acceptée',
      color: 'text-green-600',
      btnText: 'Planifier entretien',
      btnClass: 'bg-green-600 hover:bg-green-700'
    },
    rejected: {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      text: 'Refusée',
      color: 'text-red-600',
      btnText: 'Reconsidérer',
      btnClass: 'bg-gray-600 hover:bg-gray-700'
    }
  };

  const handleAction = () => {
    if (status === 'accepted') {
      // Logique pour planifier un entretien
      alert(`Planifier un entretien avec ${application.candidate_name}`);
    } else {
      // Logique pour reconsidérer
      alert(`Reconsidérer la candidature de ${application.candidate_name}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center mb-3">
            {statusConfig[status].icon}
            <span className={`ml-2 font-semibold ${statusConfig[status].color}`}>
              {statusConfig[status].text}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-gray-800">{application.job_title}</h3>
          <p className="text-gray-500 mb-4">{application.company}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <User className="flex-shrink-0 w-5 h-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Candidat</p>
                <p className="font-medium">{application.candidate_name}</p>
              </div>
            </div>

            <div className="flex items-start">
              <FileText className="flex-shrink-0 w-5 h-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Score</p>
                <p className="font-medium">{application.matchScore || 'N/A'}%</p>
              </div>
            </div>

            <div className="flex items-start">
              <Clock className="flex-shrink-0 w-5 h-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">
                  {status === 'accepted' ? 'Accepté le' : 'Refusé le'}
                </p>
                <p className="font-medium">
                  {new Date(application.updated_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col ml-4 space-y-2 min-w-[120px]">
          {application.cv_url && (
            <button
              onClick={() => window.open(application.cv_url, '_blank')}
              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Voir CV
            </button>
          )}
          <button
            onClick={handleAction}
            className={`${statusConfig[status].btnClass} text-white px-3 py-2 rounded text-sm`}
          >
            {statusConfig[status].btnText}
          </button>
        </div>
      </div>
    </div>
  );
}