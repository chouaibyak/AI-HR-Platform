import React, { useState, useEffect } from 'react';
import { Search, Bell, PanelsTopLeft } from 'lucide-react';
import ProfilMenu from './ProfilMenu';
import ProfilPage from './ProfilPage';
import Notificationbarre from './Notificationbarre';
import SideBarre from './SideBarre';
import Homme from './Homme';
import JobForm from '@/app/components/JobForm';
import CandidateRectruteur from '@/app/components/CandidateRectruteur';
import { getUserNotifications } from '@/app/services/api/apiNotification';
import { auth } from '@/app/firebase';
import MatchesRec from '@/app/components/MatchesRec';
import RapportRecruiter from '@/app/components/RapportRecruiter';
import PlacementRecruiter from '@/app/components/PlacementRecruiter';
import ContactRec from '@/app/components/ContactRec';
import ActiviteRecruiter from '@/app/components/ActiviteRecruiter';
import InboxRecruiter from '@/app/components/InboxRecruiter';
import Reports from './Reports';
import Settings from './Settings';

export default function RecruteurDashboard() {
  const [showNotification, setNotification] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showSideBar, setShowSideBar] = useState(true);
  const [activePage, setActivePage] = useState("homme");
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔁 Charger les notifications au montage du composant
  const fetchNotifications = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const data = await getUserNotifications(currentUser.uid);
      const unred = data.filter(n => !n.read);
      setNotificationCount(unred.length);
    } catch (error) {
      console.error("Erreur lors du chargement des notifications", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
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

          {/* Bouton Cloche avec Badge */}
          <button className='relative cursor-pointer' onClick={() => setNotification(prev => !prev)}>
            <Bell className='text-amber-50' size={24} />
            {/* Badge rouge avec compteur amélioré */}
            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 shadow-lg border-2 border-white">
                {notificationCount > 99 ? '99+' : notificationCount}
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
          {activePage === "homme" && <Homme onNavigate={setActivePage} />}
          {activePage === "profile" && <ProfilPage />}
          {activePage === "jobs" && <JobForm />}
          {activePage === "candidates" && <CandidateRectruteur />}
          {activePage === "matches" && <MatchesRec />}
          {activePage === "rapport" && <RapportRecruiter />}
          {activePage === "placement" && <PlacementRecruiter />}
          {activePage === "contact" && <ContactRec />}
          {activePage === "activite" && <ActiviteRecruiter />}
          {activePage === "inbox" && <InboxRecruiter />}
          {activePage === "settings" && <Settings />}
        </div>

      </div>

    </div>
  );
}