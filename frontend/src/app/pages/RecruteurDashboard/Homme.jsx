import api from '@/app/services/api/api';
import React, { useState, useEffect } from 'react';
import { Briefcase, Users, BarChart2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Homme() {
  const [userinfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeJobs: 0,
    pendingApplications: 0,
    acceptedApplications: 0
  });
  const navigate = useNavigate();

  const getUserInfo = async () => {
    try {
      const res = await api.get('/me');
      setUserInfo(res.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations:', error);
    }
  };

  const getStats = async () => {
    try {
      // Remplacez ceci par vos vrais endpoints API
      const res = await api.get('/recruiter/stats');
      setStats({
        totalApplications: res.data.totalApplications,
        activeJobs: res.data.activeJobs,
        pendingApplications: res.data.pendingApplications,
        acceptedApplications: res.data.acceptedApplications
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };

  useEffect(() => {
    getUserInfo();
    getStats();
  }, []);

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
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
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
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
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
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
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
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
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
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Créer une nouvelle offre</h3>
          <p className='text-gray-600 mb-4'>
            Publiez une nouvelle offre d'emploi pour attirer les meilleurs talents.
          </p>
          <button
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300'
            onClick={() => navigate('/recruteur/offres/nouvelle')}
          >
            Créer une offre
          </button>
        </div>

        {/* Voir les candidatures */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Gérer les candidatures</h3>
          <p className='text-gray-600 mb-4'>
            Consultez et gérez les candidatures reçues pour vos offres.
          </p>
          <button
            className='bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition duration-300'
            onClick={() => navigate('/recruteur/candidatures')}
          >
            Voir les candidatures
          </button>
        </div>
      </div>

      {/* Conseils et astuces */}
      <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
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