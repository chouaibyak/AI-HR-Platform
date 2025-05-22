import api from '@/app/services/api/api';
import React, { useState, useEffect } from 'react';
import { BarChart2, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function HommeCandidat({ onNavigate }) {
  const [userinfo, setUserInfo] = useState(null);
  const [stats, setStats] = useState({
    totalApplications: 0,
    interviews: 0,
    pending: 0,
    accepted: 0
  });

  const getUserProfil = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const res = await api.get('/me');
        console.log(res.data);
        setProfil(res.data);
      } else {
        console.error("Utilisateur non connecté");
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  // Récupère l'utilisateur connecté
  const getUserInfo = async () => {
    try {
      const res = await api.get('/me');
      setUserInfo(res.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des informations:', error);
    }
  };

  // Récupère et calcule les stats du candidat
  const getStats = async (candidateId) => {
    try {
      const res = await api.get(`/applications/candidate/${candidateId}`);
      const applications = res.data || [];
      const total = applications.length;
      const pending = applications.filter(app => app.status === 'pending').length;
      const accepted = applications.filter(app => app.status === 'accepted').length;
      const interviews = applications.filter(app => app.status === 'interview').length; // si tu as ce statut
      setStats({
        totalApplications: total,
        interviews: interviews,
        pending: pending,
        accepted: accepted
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  useEffect(() => {
    if (userinfo && userinfo.id) {
      getStats(userinfo.id);
    }
  }, [userinfo]);

  return (
    <div className='flex flex-col h-full p-6 bg-gray-50 mt-20'>
      {/* En-tête avec salutation */}
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>
          Bonjour, Candidat
        </h1>
        <p className='text-gray-600 mt-2'>
          Bienvenue sur votre espace candidat. Suivez vos candidatures et découvrez des offres adaptées.
        </p>
      </div>

      {/* Statistiques principales */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {/* Total des candidatures */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer'
          onClick={() => onNavigate && onNavigate("candidature")}>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Candidatures envoyées</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.totalApplications}</h3>
            </div>
            <div className='bg-blue-50 p-3 rounded-lg'>
              <BarChart2 className='w-6 h-6 text-blue-600' />
            </div>
          </div>
        </div>

        {/* Entretiens programmés */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Entretiens</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.interviews}</h3>
            </div>
            <div className='bg-green-50 p-3 rounded-lg'>
              <Clock className='w-6 h-6 text-green-600' />
            </div>
          </div>
        </div>

        {/* Candidatures en attente */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer'
          onClick={() => onNavigate && onNavigate("candidature")}>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>En attente</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.pending}</h3>
            </div>
            <div className='bg-yellow-50 p-3 rounded-lg'>
              <Clock className='w-6 h-6 text-yellow-600' />
            </div>
          </div>
        </div>

        {/* Candidatures acceptées */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer'
          onClick={() => onNavigate && onNavigate("candidature")}>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-500 mb-1'>Acceptées</p>
              <h3 className='text-2xl font-bold text-gray-900'>{stats.accepted}</h3>
            </div>
            <div className='bg-purple-50 p-3 rounded-lg'>
              <CheckCircle className='w-6 h-6 text-purple-600' />
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
        {/* Télécharger un CV */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Télécharger votre CV</h3>
          <p className='text-gray-600 mb-4'>
            Mettez à jour votre CV pour augmenter vos chances d'être sélectionné.
          </p>
          <button
            className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300'
            onClick={() => onNavigate && onNavigate("cv")}
          >
            Télécharger un CV
          </button>
        </div>

        {/* Voir les offres recommandées */}
        <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Voir les offres recommandées</h3>
          <p className='text-gray-600 mb-4'>
            Découvrez des offres personnalisées selon votre profil.
          </p>
          <button
            className='bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition duration-300'
            onClick={() => onNavigate && onNavigate("offre")}
          >
            Offres recommandées
          </button>
        </div>
      </div>

      {/* Conseils et astuces */}
      <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Conseils pour booster votre candidature</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='w-5 h-5 text-blue-600 mt-1' />
            <div>
              <p className='font-medium text-gray-900'>Personnalisez votre CV</p>
              <p className='text-sm text-gray-600'>Adaptez votre CV à chaque offre pour maximiser vos chances.</p>
            </div>
          </div>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='w-5 h-5 text-blue-600 mt-1' />
            <div>
              <p className='font-medium text-gray-900'>Préparez vos entretiens</p>
              <p className='text-sm text-gray-600'>Renseignez-vous sur l'entreprise avant chaque entretien.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}