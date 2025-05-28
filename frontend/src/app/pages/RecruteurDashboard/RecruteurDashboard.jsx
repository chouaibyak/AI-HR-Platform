import React, { useState, useEffect } from 'react';
import { Search, Bell, PanelsTopLeft } from 'lucide-react';
import ProfilMenu from './ProfilMenu';
import ProfilPage from './ProfilPage';
import Notificationbarre from './Notificationbarre';
import SideBarre from './SideBarre';
import Homme from './Homme';
import JobForm from '@/app/components/JobForm';
import CandidateRectruteur from '@/app/components/CandidateRectruteur';

// Import des fonctions d'API
import { getUserNotifications } from '@/app/services/api/apiNotification'; // ✅ Assurez-vous que le chemin est correct
import { auth } from '@/app/firebase'; // ✅ Firebase Auth

export default function RecruteurDashboard() {
  const [showNotification, setNotification] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showSideBar, setShowSideBar] = useState(true);
  const [activePage, setActivePage] = useState("homme");
  const [unreadCount, setUnreadCount] = useState(0); // 👈 Compteur de notifications non lues

  // Charger les notifications dès que l'utilisateur est connecté
  useEffect(() => {
    const fetchNotifications = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const data = await getUserNotifications(currentUser.uid);
        const unread = data.filter(n => !n.read);
        setUnreadCount(unread.length);
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className='h-screen flex flex-col'>
      {/* Barre de navigation */}
      <div className='bg-blue-600 fixed top-0 left-0 w-full h-16 flex items-center justify-between px-4 z-50'>
        <div className='flex items-center space-x-3'>
          <button className='text-amber-50 cursor-pointer' onClick={() => setShowSideBar(prev => !prev)}>
            <PanelsTopLeft />
          </button>
          <span className='text-amber-50 text-2xl font-semibold'>Humain+</span>
        </div>
        <div className='flex items-center space-x-4'>
          <button className='cursor-pointer' onClick={() => setShowSearchBar(prev => !prev)}>
            <Search className='text-amber-50' size={24} />
          </button>
          {showSearchBar && (
            <div className="absolute right-40 top-2 bg-blue-400 shadow-lg p-2 rounded z-50">
              <input
                type="text"
                placeholder="Rechercher..."
                className="border-gray-300 rounded px-2 py-1 w-64 focus:outline-none"
              />
            </div>
          )}

          {/* Icône de notification avec compteur */}
          <button className='relative cursor-pointer' onClick={() => setNotification(prev => !prev)}>
            <Bell className='text-amber-50' size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotification && (
            <div className='absolute right-2 top-14 z-50'>
              <Notificationbarre />
            </div>
          )}

          {/* ProfileMenu */}
          <ProfilMenu onProfileClick={() => setActivePage("profile")} />

        </div>
      </div>
      {/*end Barre de navigation */}

      {/* Layout principal */}
      <div className="flex flex-1">

        {showSideBar && <SideBarre onNavigate={setActivePage} />}

        <div className=" overflow-y-auto w-full ml-64">
          {activePage === "homme" && <Homme />}
          {activePage === "profile" && <ProfilPage />}
          {activePage === "jobs" && <JobForm />}
          {activePage === "candidates" && <CandidateRectruteur />}
          {/* Ajoute d'autres pages ici selon les boutons de ta sidebar */}
        </div>

      </div>

    </div>
  );
}