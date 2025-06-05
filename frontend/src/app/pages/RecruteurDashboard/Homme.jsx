import React, { useState, useEffect } from 'react';
import { Briefcase, Users, BarChart2, Clock, CheckCircle, AlertCircle, FileText, TrendingUp, Star, Target } from 'lucide-react';
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
    totalJobs: 0,
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

      const totalJobs = jobs.length;
      console.log("Nombre total d'offres:", totalJobs);

      const applicationsResponse = await apiApplication.get(`/applications/recruiter/${currentUser.uid}`);
      const applications = applicationsResponse.data || [];
      console.log("Candidatures récupérées:", applications);

      const totalApplications = applications.length;
      const pendingApplications = applications.filter(app => app.status === 'pending').length;
      const acceptedApplications = applications.filter(app => app.status === 'accepted').length;

      console.log("Statistiques calculées:", {
        totalApplications,
        totalJobs,
        pendingApplications,
        acceptedApplications
      });

      setStats({
        totalApplications,
        totalJobs,
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
          totalJobs: 0,
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
      <div className="flex items-center justify-center min-h-screen pt-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20 bg-gradient-to-br from-red-50 via-white to-pink-50">
        <div className="bg-white border border-red-100 rounded-2xl p-8 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-3">Oops ! Une erreur s'est produite</h3>
          <p className="text-red-600 mb-6 leading-relaxed">{error}</p>
          <button
            onClick={fetchData}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Calcul du taux d'acceptation
  const acceptanceRate = stats.totalApplications > 0
    ? Math.round((stats.acceptedApplications / stats.totalApplications) * 100)
    : 0;

  // Déterminer le message d'accueil selon l'heure
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 17) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className='flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 mt-20'>
      <div className="max-w-7xl mx-auto w-full p-6 space-y-8">
        {/* En-tête avec salutation améliorée */}
        <div className='bg-white rounded-3xl shadow-sm p-8 border border-gray-100/50 backdrop-blur-sm'>
          <div className="flex items-center justify-between">
            <div>
              <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-700 bg-clip-text text-transparent'>
                {getGreeting()}, {userinfo?.name || 'Recruteur'} 👋
              </h1>
              <p className='text-gray-600 mt-3 text-lg'>
                Bienvenue sur votre tableau de bord. Gérez vos offres et suivez vos candidatures.
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart2 className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques principales avec design moderne */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {/* Total des candidatures */}
          <div className='group bg-white rounded-2xl shadow-sm p-6 border border-gray-100/50 hover:shadow-xl hover:border-blue-200/50 transition-all duration-300 transform hover:-translate-y-1'>
            <div className='flex items-center justify-between mb-4'>
              <div className='bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-lg group-hover:shadow-blue-200 transition-shadow duration-300'>
                <Users className='w-6 h-6 text-white' />
              </div>
              <div className="text-right">
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +12%
                </div>
              </div>
            </div>
            <div>
              <p className='text-sm text-gray-500 mb-2 font-medium'>Total des candidatures</p>
              <h3 className='text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300'>
                {stats.totalApplications}
              </h3>
            </div>
          </div>

          {/* Total des offres */}
          <div className='group bg-white rounded-2xl shadow-sm p-6 border border-gray-100/50 hover:shadow-xl hover:border-green-200/50 transition-all duration-300 transform hover:-translate-y-1'>
            <div className='flex items-center justify-between mb-4'>
              <div className='bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg group-hover:shadow-green-200 transition-shadow duration-300'>
                <Briefcase className='w-6 h-6 text-white' />
              </div>
              <div className="text-right">
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <Star className="w-4 h-4 mr-1" />
                  Actif
                </div>
              </div>
            </div>
            <div>
              <p className='text-sm text-gray-500 mb-2 font-medium'>Total des offres</p>
              <h3 className='text-3xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300'>
                {stats.totalJobs}
              </h3>
            </div>
          </div>

          {/* Candidatures en attente */}
          <div className='group bg-white rounded-2xl shadow-sm p-6 border border-gray-100/50 hover:shadow-xl hover:border-yellow-200/50 transition-all duration-300 transform hover:-translate-y-1'>
            <div className='flex items-center justify-between mb-4'>
              <div className='bg-gradient-to-br from-yellow-500 to-orange-500 p-3 rounded-xl shadow-lg group-hover:shadow-yellow-200 transition-shadow duration-300'>
                <Clock className='w-6 h-6 text-white' />
              </div>
              <div className="text-right">
                <div className="flex items-center text-orange-600 text-sm font-medium">
                  <Target className="w-4 h-4 mr-1" />
                  Action
                </div>
              </div>
            </div>
            <div>
              <p className='text-sm text-gray-500 mb-2 font-medium'>En attente</p>
              <h3 className='text-3xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors duration-300'>
                {stats.pendingApplications}
              </h3>
            </div>
          </div>

          {/* Candidatures acceptées */}
          <div className='group bg-white rounded-2xl shadow-sm p-6 border border-gray-100/50 hover:shadow-xl hover:border-purple-200/50 transition-all duration-300 transform hover:-translate-y-1'>
            <div className='flex items-center justify-between mb-4'>
              <div className='bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg group-hover:shadow-purple-200 transition-shadow duration-300'>
                <CheckCircle className='w-6 h-6 text-white' />
              </div>
              <div className="text-right">
                <div className="flex items-center text-purple-600 text-sm font-medium">
                  {acceptanceRate}%
                </div>
              </div>
            </div>
            <div>
              <p className='text-sm text-gray-500 mb-2 font-medium'>Acceptées</p>
              <h3 className='text-3xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300'>
                {stats.acceptedApplications}
              </h3>
            </div>
          </div>
        </div>

        {/* Actions rapides avec design modernisé */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Créer une nouvelle offre */}
          <div className='group bg-white rounded-2xl shadow-sm p-8 border border-gray-100/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden'>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-16 translate-x-16 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center mb-4">
                <div className='bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg mr-4'>
                  <Briefcase className='w-6 h-6 text-white' />
                </div>
                <h3 className='text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300'>
                  Créer une nouvelle offre
                </h3>
              </div>
              <p className='text-gray-600 mb-6 leading-relaxed'>
                Publiez une nouvelle offre d'emploi pour attirer les meilleurs talents et développer votre équipe.
              </p>
              <button
                className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group-hover:scale-105'
                onClick={() => onNavigate('jobs')}
              >
                Créer une offre
              </button>
            </div>
          </div>

          {/* Voir les candidatures */}
          <div className='group bg-white rounded-2xl shadow-sm p-8 border border-gray-100/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden'>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-full -translate-y-16 translate-x-16 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center mb-4">
                <div className='bg-gradient-to-br from-green-500 to-blue-600 p-3 rounded-xl shadow-lg mr-4'>
                  <Users className='w-6 h-6 text-white' />
                </div>
                <h3 className='text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300'>
                  Gérer les candidatures
                </h3>
              </div>
              <p className='text-gray-600 mb-6 leading-relaxed'>
                Consultez et gérez les candidatures reçues pour vos offres. Trouvez le candidat parfait.
              </p>
              <button
                className='bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-3 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group-hover:scale-105'
                onClick={() => onNavigate('candidates')}
              >
                Voir les candidatures
              </button>
            </div>
          </div>
        </div>

        {/* Conseils et astuces redesignés */}
        <div className='bg-gradient-to-r from-indigo-50 via-white to-purple-50 rounded-2xl shadow-sm p-8 border border-indigo-100/50'>
          <div className="flex items-center mb-6">
            <div className='bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg mr-4'>
              <Star className='w-6 h-6 text-white' />
            </div>
            <h3 className='text-xl font-bold text-gray-900'>Conseils pour optimiser vos recrutements</h3>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='group flex items-start space-x-4 p-4 rounded-xl hover:bg-white/50 transition-all duration-300'>
              <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors duration-300">
                <FileText className='w-5 h-5 text-blue-600' />
              </div>
              <div>
                <p className='font-semibold text-gray-900 mb-1'>Rédigez des descriptions claires</p>
                <p className='text-sm text-gray-600 leading-relaxed'>Une description précise et détaillée augmente significativement la qualité des candidatures reçues</p>
              </div>
            </div>

            <div className='group flex items-start space-x-4 p-4 rounded-xl hover:bg-white/50 transition-all duration-300'>
              <div className="w-10 h-10 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center transition-colors duration-300">
                <TrendingUp className='w-5 h-5 text-purple-600' />
              </div>
              <div>
                <p className='font-semibold text-gray-900 mb-1'>Utilisez le matching IA</p>
                <p className='text-sm text-gray-600 leading-relaxed'>Notre intelligence artificielle vous aide à identifier et classer les meilleurs candidats automatiquement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}