import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import apiNotification from '../services/api/apiNotification';
import { Bell, Inbox, Mail, MailOpen, Clock, AlertCircle } from 'lucide-react';

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

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex justify-center items-center h-96">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 shadow-lg"></div>
            <p className="mt-4 text-slate-600 font-medium">Chargement de vos notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-50">
        <div className="flex items-center justify-center h-96">
          <div className="bg-white/90 backdrop-blur-sm border border-red-200 rounded-2xl p-8 text-center shadow-2xl max-w-md mx-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-3">Erreur de chargement</h2>
            <p className="text-red-600 leading-relaxed">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 mt-20">
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-xl border border-slate-200/60">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Inbox className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Boîte de réception
              </h2>
              <p className="text-slate-600">Restez informé de vos candidatures</p>
            </div>
            {unreadCount > 0 && (
              <div className="ml-auto">
                <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                  {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 shadow-lg border border-slate-200/60">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === 'all'
                ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" />
                Toutes les notifications
              </div>
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === 'unread'
                ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <MailOpen className="w-4 h-4" />
                Non lues
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <div
                key={index}
                className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden ${!notification.read
                  ? 'border-l-4 border-l-blue-500 border-slate-200/60 bg-gradient-to-r from-blue-50/50 to-white/90'
                  : 'border-slate-200/60'
                  }`}
              >
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${!notification.read
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                      }`}>
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={`text-lg font-semibold ${!notification.read ? 'text-slate-900' : 'text-slate-700'
                              }`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <p className={`leading-relaxed ${!notification.read ? 'text-slate-700' : 'text-slate-600'
                            }`}>
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 flex-shrink-0">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {!notification.read && (
                  <div className="h-1 w-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-lg border border-slate-200/60">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Inbox className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {activeTab === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
              </h3>
              <p className="text-slate-500 text-lg">
                {activeTab === 'unread'
                  ? 'Toutes vos notifications ont été lues !'
                  : 'Vous recevrez ici les mises à jour sur vos candidatures'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InboxCandidat;