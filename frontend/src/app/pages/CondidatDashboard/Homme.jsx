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

      // 2. Récupérer les candidatures
      const applicationsRes = await apiApplication.get(`/applications/candidate/${user.uid}`);
      console.log("Réponse API:", applicationsRes.data);
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
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="bg-white/90 backdrop-blur-sm border border-red-200 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-3">Oups ! Une erreur s'est produite</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 mt-20 min-h-screen'>
      {/* En-tête avec salutation */}
      <div className='mb-10 relative'>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl opacity-10 transform -rotate-1"></div>
        <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
          <h1 className='text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3'>
            Bonjour, Candidat 👋
          </h1>
          <p className='text-gray-700 text-lg leading-relaxed'>
            Bienvenue sur votre espace candidat. Suivez vos candidatures et découvrez des offres adaptées.
          </p>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10'>
        {/* Total des candidatures */}
        <div className='group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-white/50 cursor-pointer transform hover:-translate-y-2 transition-all duration-300'
          onClick={() => onNavigate && onNavigate("candidature")}>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 mb-2 font-medium'>Candidatures envoyées</p>
              <h3 className='text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200'>{stats.totalApplications}</h3>
            </div>
            <div className='bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-200'>
              <BarChart2 className='w-7 h-7 text-white' />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Entretiens programmés */}
        <div className='group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-white/50 transform hover:-translate-y-2 transition-all duration-300'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 mb-2 font-medium'>Entretiens</p>
              <h3 className='text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-200'>{stats.interviews}</h3>
            </div>
            <div className='bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-200'>
              <Clock className='w-7 h-7 text-white' />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Candidatures en attente */}
        <div className='group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-white/50 cursor-pointer transform hover:-translate-y-2 transition-all duration-300'
          onClick={() => onNavigate && onNavigate("candidature")}>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 mb-2 font-medium'>En attente</p>
              <h3 className='text-3xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors duration-200'>{stats.pending}</h3>
            </div>
            <div className='bg-gradient-to-br from-yellow-500 to-orange-500 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-200'>
              <Clock className='w-7 h-7 text-white' />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Candidatures acceptées */}
        <div className='group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-6 border border-white/50 cursor-pointer transform hover:-translate-y-2 transition-all duration-300'
          onClick={() => onNavigate && onNavigate("candidature")}>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600 mb-2 font-medium'>Acceptées</p>
              <h3 className='text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-200'>{stats.accepted}</h3>
            </div>
            <div className='bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-200'>
              <CheckCircle className='w-7 h-7 text-white' />
            </div>
          </div>
          <div className="mt-4 h-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-10'>
        {/* Télécharger un CV */}
        <div className='group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-8 border border-white/50 transform hover:-translate-y-1 transition-all duration-300'>
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className='text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200'>Télécharger votre CV</h3>
          </div>
          <p className='text-gray-600 mb-6 leading-relaxed'>
            Mettez à jour votre CV pour augmenter vos chances d'être sélectionné par les recruteurs.
          </p>
          <button
            className='bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center'
            onClick={() => onNavigate && onNavigate("cv")}
          >
            Télécharger un CV
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </button>
        </div>

        {/* Voir les offres recommandées */}
        <div className='group bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-8 border border-white/50 transform hover:-translate-y-1 transition-all duration-300'>
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl mr-4 group-hover:scale-110 transition-transform duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
            </div>
            <h3 className='text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors duration-200'>Offres recommandées</h3>
          </div>
          <p className='text-gray-600 mb-6 leading-relaxed'>
            Découvrez des offres personnalisées selon votre profil et vos compétences.
          </p>
          <button
            className='bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center'
            onClick={() => onNavigate && onNavigate("offre")}
          >
            Voir les offres
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Conseils et astuces */}
      <div className='bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/50'>
        <div className="flex items-center mb-6">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-2xl mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className='text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent'>
            Conseils pour booster votre candidature
          </h3>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='flex items-start space-x-4 p-4 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors duration-200'>
            <div className="bg-blue-500 p-2 rounded-lg flex-shrink-0">
              <AlertCircle className='w-5 h-5 text-white' />
            </div>
            <div>
              <p className='font-semibold text-gray-900 mb-1'>Personnalisez votre CV</p>
              <p className='text-sm text-gray-700 leading-relaxed'>Adaptez votre CV à chaque offre pour maximiser vos chances d'être remarqué.</p>
            </div>
          </div>
          <div className='flex items-start space-x-4 p-4 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 transition-colors duration-200'>
            <div className="bg-emerald-500 p-2 rounded-lg flex-shrink-0">
              <AlertCircle className='w-5 h-5 text-white' />
            </div>
            <div>
              <p className='font-semibold text-gray-900 mb-1'>Préparez vos entretiens</p>
              <p className='text-sm text-gray-700 leading-relaxed'>Renseignez-vous sur l'entreprise et ses valeurs avant chaque entretien.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}