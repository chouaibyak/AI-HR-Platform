import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
    totalMatches: 0,
    totalPlacements: 0
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("Veuillez vous connecter");
          return;
        }

        // Récupérer les statistiques depuis Firestore
        const jobsRef = collection(db, 'jobs');
        const candidatesRef = collection(db, 'candidates');
        const matchesRef = collection(db, 'matches');
        const placementsRef = collection(db, 'placements');

        // Requêtes pour les différentes collections
        const jobsQuery = query(jobsRef, where('recruiter_id', '==', currentUser.uid));
        const candidatesQuery = query(candidatesRef, where('recruiter_id', '==', currentUser.uid));
        const matchesQuery = query(matchesRef, where('recruiter_id', '==', currentUser.uid));
        const placementsQuery = query(placementsRef, where('recruiter_id', '==', currentUser.uid));

        // Exécuter les requêtes
        const [jobsSnapshot, candidatesSnapshot, matchesSnapshot, placementsSnapshot] = await Promise.all([
          getDocs(jobsQuery),
          getDocs(candidatesQuery),
          getDocs(matchesQuery),
          getDocs(placementsQuery)
        ]);

        // Calculer les statistiques
        const activeJobs = jobsSnapshot.docs.filter(doc => doc.data().status === 'active').length;

        setStats({
          totalJobs: jobsSnapshot.size,
          activeJobs,
          totalCandidates: candidatesSnapshot.size,
          totalMatches: matchesSnapshot.size,
          totalPlacements: placementsSnapshot.size
        });

      } catch (err) {
        console.error("Erreur lors du chargement des statistiques:", err);
        setError("Erreur lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const pieData = [
    { name: 'Offres actives', value: stats.activeJobs },
    { name: 'Candidats', value: stats.totalCandidates },
    { name: 'Matches', value: stats.totalMatches },
    { name: 'Placements', value: stats.totalPlacements }
  ];

  const barData = [
    { name: 'Offres', total: stats.totalJobs, active: stats.activeJobs },
    { name: 'Candidats', total: stats.totalCandidates },
    { name: 'Matches', total: stats.totalMatches },
    { name: 'Placements', total: stats.totalPlacements }
  ];

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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Rapports et Statistiques</h1>
        <p className="text-gray-600">Vue d'ensemble de votre activité</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Offres d'emploi</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalJobs}</p>
          <p className="text-sm text-gray-500 mt-1">{stats.activeJobs} offres actives</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Candidats</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.totalCandidates}</p>
          <p className="text-sm text-gray-500 mt-1">Candidats en base</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Matches</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.totalMatches}</p>
          <p className="text-sm text-gray-500 mt-1">Correspondances trouvées</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Placements</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">{stats.totalPlacements}</p>
          <p className="text-sm text-gray-500 mt-1">Placements réussis</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graphique en barres */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Activité globale</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#8884d8" name="Total" />
                <Bar dataKey="active" fill="#82ca9d" name="Actifs" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique en camembert */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Répartition des activités</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports; 