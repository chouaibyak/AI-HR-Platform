import React, { useEffect, useState } from 'react';
import { auth } from '../../firebase'; // Firebase Auth
import {
  getUserNotifications,
  markNotificationAsRead
} from '../../services/api/apiNotification';

export default function Notificationbarre() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les notifications non lues du candidat connecté
  useEffect(() => {
    const fetchNotifications = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const data = await getUserNotifications(currentUser.uid); // ✅ Appel direct
        setNotifications(data.filter(n => !n.read)); // Ne garder que les notifications non lues
      } catch (error) {
        console.error("Erreur lors de la récupération des notifications", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Gérer le clic sur une notification
  const handleNotificationClick = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId); // ✅ Appel direct
      setNotifications(notifications.filter(n => n.id !== notificationId)); // Retirer de l'affichage
    } catch (error) {
      console.error("Erreur lors du marquage comme lu", error);
    }
  };

  if (loading) {
    return (
      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
      {/* Header avec compteur */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-lg">Notifications</h3>
          {notifications.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px] h-5">
                {notifications.length}
              </span>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu des notifications */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Aucune nouvelle notification</p>
            <p className="text-xs text-gray-400 mt-1">Vous êtes à jour !</p>
          </div>
        ) : (
          <div className="py-2">
            {notifications.map((notification, index) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
                className="group relative px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 border-b border-gray-50 last:border-b-0"
              >
                {/* Indicateur de nouvelle notification */}
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors"></div>

                <div className="flex items-start space-x-3 ml-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V8m8 0V6a2 2 0 00-2-2H10a2 2 0 00-2 2v2" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 group-hover:text-gray-900 transition-colors">
                      {notification.message || "Nouvelle offre d'emploi"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Il y a quelques instants
                    </p>
                  </div>

                  {/* Flèche */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer optionnel */}
      {notifications.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Marquer toutes comme lues
          </button>
        </div>
      )}
    </div>
  );
}