import React, { useState, useEffect } from 'react';
import { Briefcase, User, MessageSquare, Calendar, FileText, CheckCircle2, XCircle, Activity, Clock } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import apiApplication from '../services/api/apiApplication';
import apiJob from '../services/api/apiJob';

const ActiviteRecruiter = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("Veuillez vous connecter");
          setLoading(false);
          return;
        }

        // Récupérer les offres d'emploi
        const jobsResponse = await apiJob.get(`/jobs/recruiter/${currentUser.uid}`);
        const jobs = jobsResponse.data || [];

        // Récupérer les candidatures
        const applicationsResponse = await apiApplication.get(`/applications/recruiter/${currentUser.uid}`);
        const applications = applicationsResponse.data || [];

        // Combiner et formater les activités
        const allActivities = [
          // Activités liées aux offres d'emploi
          ...jobs.map(job => ({
            type: 'job_posted',
            date: new Date(job.created_at),
            job_title: job.title,
            company: job.company,
            description: `Publication d'une nouvelle offre : ${job.title}`
          })),

          // Activités liées aux candidatures
          ...applications.map(app => ({
            type: app.status === 'accepted' ? 'application_accepted' :
              app.status === 'rejected' ? 'application_rejected' : 'application_reviewed',
            date: new Date(app.created_at),
            job_title: app.job?.title || 'Offre sans titre',
            candidate_name: app.candidate?.name || 'Candidat inconnu',
            status: app.status,
            description: `Candidature de ${app.candidate?.name || 'un candidat'} pour ${app.job?.title || 'une offre'}`
          }))
        ].sort((a, b) => b.date - a.date);

        setActivities(allActivities);
      } catch (err) {
        console.error("Erreur lors du chargement des activités:", err);
        setError("Erreur lors du chargement des activités");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'job_posted':
        return <Briefcase className="text-blue-500" size={20} />;
      case 'application_reviewed':
        return <FileText className="text-orange-500" size={20} />;
      case 'application_accepted':
        return <CheckCircle2 className="text-green-500" size={20} />;
      case 'application_rejected':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Briefcase className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-100 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement des activités...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-20 ml-8 mr-8">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 ml-8 mr-8 mb-8">
      {/* Header avec design moderne */}
      <div className="mb-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 shadow-sm border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <div className="bg-purple-100 rounded-xl p-2 mr-3">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                Activités Récentes
              </h1>
            </div>
            <p className="text-slate-600 font-medium">
              Suivez toutes vos actions sur la plateforme • {activities.length} activité{activities.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{activities.length}</div>
              <div className="text-sm text-slate-500">Action{activities.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Carte principale des activités avec design amélioré */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm p-8 border border-slate-200">
          <div className="space-y-6">
            {activities.length === 0 ? (
              <div className="text-center text-slate-500 py-12">
                <div className="bg-slate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                  <Activity size={40} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">Aucune activité récente</h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  Vos actions sur la plateforme apparaîtront ici. Commencez par publier une offre ou évaluer des candidatures !
                </p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-5 bg-white rounded-xl border border-slate-200 hover:shadow-md hover:border-purple-200 transition-all duration-300 group"
                >
                  {/* Icône avec container coloré */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-lg ${activity.type === 'job_posted' ? 'bg-blue-100' :
                        activity.type === 'application_accepted' ? 'bg-green-100' :
                          activity.type === 'application_rejected' ? 'bg-red-100' :
                            'bg-orange-100'
                      }`}>
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-800 group-hover:text-purple-700 transition-colors">
                        {activity.job_title}
                      </h3>
                      <div className="flex items-center text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        <Clock className="w-3 h-3 mr-1" />
                        <span className="text-sm font-medium">
                          {activity.date.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 mb-3 leading-relaxed">{activity.description}</p>

                    {activity.status && (
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status === 'accepted' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {activity.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                          {activity.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                          {activity.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiviteRecruiter;