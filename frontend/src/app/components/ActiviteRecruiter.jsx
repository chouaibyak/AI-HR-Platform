import React, { useState, useEffect } from 'react';
import { Briefcase, User, MessageSquare, Calendar, FileText, CheckCircle2, XCircle } from 'lucide-react';
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
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 ml-8 mr-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Activités Récentes</h1>
        <p className="text-gray-600 mt-2">
          Suivez toutes vos actions sur la plateforme
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Carte principale des activités */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="space-y-6">
            {activities.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Briefcase size={48} className="mx-auto mb-4" />
                <p className="text-lg">Aucune activité récente</p>
                <p className="text-sm text-gray-400 mt-2">
                  Vos actions sur la plateforme apparaîtront ici
                </p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{activity.job_title}</h3>
                      <span className="text-sm text-gray-500">
                        {activity.date.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{activity.description}</p>
                    {activity.status && (
                      <span className={`inline-block px-2 py-1 rounded-full text-sm mt-2 ${getStatusColor(activity.status)}`}>
                        {activity.status}
                      </span>
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
