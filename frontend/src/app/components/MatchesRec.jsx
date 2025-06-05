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
      const processedApps = allApplications.map(app => ({
        ...app,
        id: app.id,
        job_title: app.job?.title || app.job_title,
        company: app.job?.company || app.company,
        candidate_name: app.candidate?.name || app.candidate_name,
        matchScore: app.match_score || app.matchScore || 0, // Prend en compte les deux formats
        updated_at: app.updated_at || app.created_at
      })).filter(app =>
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-100 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement des matches...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-20 ml-8 mr-8">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-8 text-center shadow-sm">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Oups, une erreur s'est produite</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchMatches}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center mx-auto transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="mr-2" size={18} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const acceptedApps = applications.filter(app => app.status === 'accepted');
  const rejectedApps = applications.filter(app => app.status === 'rejected');

  return (
    <div className="mt-20 ml-8 mr-8 mb-8">
      {/* Header avec gradient */}
      <div className="mb-8 bg-gradient-to-r from-white to-blue-50 rounded-2xl p-6 shadow-sm border border-blue-100">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-blue-800 bg-clip-text text-transparent">
              Matches
            </h1>
            <p className="text-slate-600 mt-1 font-medium">Vos candidatures traitées</p>
            <div className="flex items-center mt-3 space-x-4">
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">{acceptedApps.length} acceptées</span>
              </div>
              <div className="flex items-center text-red-500">
                <XCircle className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">{rejectedApps.length} refusées</span>
              </div>
            </div>
          </div>
          <button
            onClick={fetchMatches}
            className="flex items-center text-blue-600 hover:text-blue-800 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-blue-200"
          >
            <RefreshCw className="mr-2" size={16} />
            Actualiser
          </button>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="bg-slate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-3">Aucun match pour le moment</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Vous n'avez pas encore traité de candidatures. Les matches apparaîtront ici une fois que vous aurez accepté ou refusé des candidatures.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Section Acceptées */}
          {acceptedApps.length > 0 && (
            <div>
              <div className="flex items-center mb-6">
                <div className="bg-green-100 rounded-xl p-2 mr-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Candidatures acceptées</h2>
                  <p className="text-green-600 font-medium">{acceptedApps.length} candidat{acceptedApps.length > 1 ? 's' : ''} sélectionné{acceptedApps.length > 1 ? 's' : ''}</p>
                </div>
              </div>
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
              <div className="flex items-center mb-6">
                <div className="bg-red-100 rounded-xl p-2 mr-3">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Candidatures refusées</h2>
                  <p className="text-red-500 font-medium">{rejectedApps.length} candidature{rejectedApps.length > 1 ? 's' : ''} déclinée{rejectedApps.length > 1 ? 's' : ''}</p>
                </div>
              </div>
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
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      text: 'Acceptée',
      color: 'text-green-700',
      bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50',
      borderColor: 'border-green-200',
      badgeColor: 'bg-green-100 text-green-800',
      btnText: 'Planifier entretien',
      btnClass: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl'
    },
    rejected: {
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      text: 'Refusée',
      color: 'text-red-700',
      bgColor: 'bg-gradient-to-r from-red-50 to-rose-50',
      borderColor: 'border-red-200',
      badgeColor: 'bg-red-100 text-red-800',
      btnText: 'Reconsidérer',
      btnClass: 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-lg hover:shadow-xl'
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
    <div className={`${statusConfig[status].bgColor} rounded-2xl shadow-sm border ${statusConfig[status].borderColor} p-6 hover:shadow-lg transition-all duration-300 group`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Status Badge */}
          <div className="flex items-center mb-4">
            <div className={`${statusConfig[status].badgeColor} px-3 py-1 rounded-full flex items-center font-medium text-sm`}>
              {statusConfig[status].icon}
              <span className="ml-2">{statusConfig[status].text}</span>
            </div>
          </div>

          {/* Job Info */}
          <div className="mb-5">
            <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-blue-800 transition-colors">
              {application.job_title}
            </h3>
            <p className="text-slate-600 font-medium flex items-center">
              <Briefcase className="w-4 h-4 mr-2" />
              {application.company}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center mb-2">
                <User className="w-4 h-4 text-slate-500 mr-2" />
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Candidat</p>
              </div>
              <p className="font-semibold text-slate-800">{application.candidate_name}</p>
            </div>

            <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center mb-2">
                <FileText className="w-4 h-4 text-slate-500 mr-2" />
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Score</p>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-slate-800 text-lg">{application.matchScore || 'N/A'}</span>
                {application.matchScore && <span className="text-slate-600 ml-1">%</span>}
              </div>
            </div>

            <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center mb-2">
                <Clock className="w-4 h-4 text-slate-500 mr-2" />
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  {status === 'accepted' ? 'Accepté le' : 'Refusé le'}
                </p>
              </div>
              <p className="font-semibold text-slate-800">
                {new Date(application.updated_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col ml-6 space-y-3 min-w-[140px]">
          {application.cv_url && (
            <button
              onClick={() => window.open(application.cv_url, '_blank')}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium border border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              📄 Voir CV
            </button>
          )}
          <button
            onClick={handleAction}
            className={`${statusConfig[status].btnClass} text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200`}
          >
            {statusConfig[status].btnText}
          </button>
        </div>
      </div>
    </div>
  );
}