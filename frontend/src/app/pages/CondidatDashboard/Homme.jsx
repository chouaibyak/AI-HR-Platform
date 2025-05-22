import api from '@/app/services/api/api';
import React, { useState, useEffect } from 'react';
import { BarChart2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import apiApplication from '@/app/services/api/apiApplication';
import { auth, } from '@/app/firebase';

export default function HommeCandidat({ onNavigate }) {
  const [stats, setStats] = useState({
    totalApplications: 0,
    interviews: 0,
    pending: 0,
    accepted: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction unique pour charger toutes les données
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer les infos utilisateur
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const candidateId = user.uid; // Utilisez uid au lieu de id
      console.log('ID candidat:', candidateId); // Debug

      // 2. Récupérer les candidatures
      const applicationsRes = await apiApplication.get(`/applications/candidate/${candidateId}`);
      const applications = applicationsRes.data || [];

      // 3. Calculer les statistiques
      setStats({
        totalApplications: applications.length,
        interviews: applications.filter(app => app.status === 'interview').length,
        pending: applications.filter(app => app.status === 'pending').length,
        accepted: applications.filter(app => app.status === 'accepted').length
      });

    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchData();
      } else {
        setError('Veuillez vous connecter');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

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
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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