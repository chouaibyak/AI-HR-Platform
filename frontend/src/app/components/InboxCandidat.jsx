import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import apiNotification from '../services/api/apiNotification';
import { Bell } from 'lucide-react';

const InboxCandidat = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all' ou 'unread'

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;

        if (!user) {
          setError('Utilisateur non connecté');
          setLoading(false);
          return;
        }

        const response = await apiNotification.get(`/notifications/user/${user.uid}`);
        console.log('Notifications reçues:', response.data);

        // Nettoyer et formater les données
        const cleanedNotifications = (response.data || []).map(notification => ({
          ...notification,
          title: notification.title || 'Notification',
          message: notification.message || 'Aucun message',
          created_at: notification.created_at || new Date().toISOString(),
          read: notification.read || false
        }));

        setNotifications(cleanedNotifications);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des notifications:', err);
        setError('Une erreur est survenue lors du chargement des notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') {
      return !notification.read;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Boîte de réception</h2>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-4 ${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Tout
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={`pb-2 px-4 ${activeTab === 'unread' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
        >
          Non lus
        </button>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow p-4 ${!notification.read ? 'border-l-4 border-blue-500' : ''}`}
            >
              <div className="flex items-start space-x-4">
                <Bell className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{notification.title}</h3>
                    <span className="text-sm text-gray-500">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucune notification</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxCandidat;
