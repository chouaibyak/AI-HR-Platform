import React, { useState, useEffect } from 'react';
import { Briefcase, Users, BarChart2, Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/app/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import apiJob from '@/app/services/api/apiJob';
import apiApplication from '@/app/services/api/apiApplication';
import api from '@/app/services/api/api';

export default function Homme({ onNavigate }) {
  const [userinfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeJobs: 0,
    pendingApplications: 0,
    acceptedApplications: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Aucun utilisateur connecté");
        setLoading(false);
        return;
      }

      console.log("Utilisateur connecté:", currentUser.uid);

      try {
        const userRes = await api.get('/me');
        setUserInfo(userRes.data);
      } catch (userError) {
        console.error("Erreur lors de la récupération des infos utilisateur via API:", userError);
      }

      const jobsResponse = await apiJob.get(`/jobs/recruiter/${currentUser.uid}`);
      const jobs = jobsResponse.data || [];
      console.log("Offres récupérées:", jobs);

      const activeJobs = jobs.filter(job => job.status === 'active').length;
      console.log("Offres actives calculées:", activeJobs);

      const applicationsResponse = await apiApplication.get(`/applications/recruiter/${currentUser.uid}`);
      const applications = applicationsResponse.data || [];
      console.log("Candidatures récupérées:", applications);

      const totalApplications = applications.length;
      const pendingApplications = applications.filter(app => app.status === 'pending').length;
      const acceptedApplications = applications.filter(app => app.status === 'accepted').length;

      console.log("Statistiques calculées:", {
        totalApplications,
        activeJobs,
        pendingApplications,
        acceptedApplications
      });

      setStats({
        totalApplications,
        activeJobs,
        pendingApplications,
        acceptedApplications
      });

    } catch (err) {
      console.error("Erreur lors du chargement des données via API:", err);
      setError('Erreur lors du chargement des données statistiques. Veuillez vérifier votre connexion et les logs du backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        console.log("User state changed: logged in", user.uid);
        fetchData();
      } else {
        console.log("User state changed: logged out");
        setError('Veuillez vous connecter pour voir vos statistiques.');
        setLoading(false);
        setStats({
          totalApplications: 0,
          activeJobs: 0,
          pendingApplications: 0,
          acceptedApplications: 0
        });
        setUserInfo(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentUser = auth.currentUser;
      if (currentUser && !loading && !error) {
        console.log("Refreshing data...");
        fetchData();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [loading, error]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full p-6 bg-gray-50 mt-20'>
      {/* En-tête avec salutation */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>
          Bonjour, {userinfo?.name || 'Recruteur'}
        </h1>
        <p className='text-gray-600 mt-2'>
          Bienvenue sur votre tableau de bord. Gérez vos offres et suivez vos candidatures.
        </p>
      </div>

      {/* Statistiques principales */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {/* Total des candidatures */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Total des candidatures</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.totalApplications}</h3>
            </div>
            <div className='bg-blue-50 p-3 rounded-lg'>
              <Users className='w-6 h-6 text-blue-600' />
            </div>
          </div>
        </div>

        {/* Offres actives */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Offres actives</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.activeJobs}</h3>
            </div>
            <div className='bg-green-50 p-3 rounded-lg'>
              <Briefcase className='w-6 h-6 text-green-600' />
            </div>
          </div>
        </div>

        {/* Candidatures en attente */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>En attente</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.pendingApplications}</h3>
            </div>
            <div className='bg-yellow-50 p-3 rounded-lg'>
              <Clock className='w-6 h-6 text-yellow-600' />
            </div>
          </div>
        </div>

        {/* Candidatures acceptées */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Acceptées</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.acceptedApplications}</h3>
            </div>
            <div className='bg-purple-50 p-3 rounded-lg'>
              <CheckCircle className='w-6 h-6 text-purple-600' />
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
        {/* Créer une nouvelle offre */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Créer une nouvelle offre</h3>
          <p className='text-gray-600 mb-4'>
            Publiez une nouvelle offre d'emploi pour attirer les meilleurs talents.
          </p>
          <button
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300'
            onClick={() => onNavigate && onNavigate('create-job')}
          >
            Créer une offre
          </button>
        </div>

        {/* Voir les candidatures */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Gérer les candidatures</h3>
          <p className='text-gray-600 mb-4'>
            Consultez et gérez les candidatures reçues pour vos offres.
          </p>
          <button
            className='bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition duration-300'
            onClick={() => onNavigate && onNavigate('manage-applications')}
          >
            Voir les candidatures
          </button>
        </div>
      </div>

      {/* Conseils et astuces */}
      <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow duration-300'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Conseils pour optimiser vos recrutements</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='w-5 h-5 text-blue-600 mt-1' />
            <div>
              <p className='font-medium text-gray-900'>Rédigez des descriptions claires</p>
              <p className='text-sm text-gray-600'>Une description précise augmente la qualité des candidatures</p>
            </div>
          </div>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='w-5 h-5 text-blue-600 mt-1' />
            <div>
              <p className='font-medium text-gray-900'>Utilisez le matching IA</p>
              <p className='text-sm text-gray-600'>Notre IA vous aide à trouver les meilleurs candidats</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}