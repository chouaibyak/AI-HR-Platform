import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { User, Bell, Lock, Globe, Mail, Shield } from 'lucide-react';

const Settings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    location: '',
    language: 'fr',
    notifications: {
      email: true,
      push: true,
      matches: true,
      applications: true
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false
    }
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setError('Utilisateur non connecté');
          return;
        }

        setUser(currentUser);
        setFormData(prev => ({
          ...prev,
          displayName: currentUser.displayName || '',
          email: currentUser.email || ''
        }));
      } catch (err) {
        console.error('Erreur lors de la récupération des données:', err);
        setError('Une erreur est survenue lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (type) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };

  const handlePrivacyChange = (setting) => {
    setFormData(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [setting]: !prev.privacy[setting]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Mettre à jour les informations de l'utilisateur
      if (user) {
        await user.updateProfile({
          displayName: formData.displayName
        });
        // Ici, vous pouvez ajouter la logique pour sauvegarder d'autres paramètres
      }
      alert('Paramètres mis à jour avec succès');
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      alert('Erreur lors de la mise à jour des paramètres');
    }
  };

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
      <h2 className="text-2xl font-bold mb-6">Paramètres</h2>

      {/* Navigation */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-2 px-4 flex items-center space-x-2 ${activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
            }`}
        >
          <User size={18} />
          <span>Profil</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`pb-2 px-4 flex items-center space-x-2 ${activeTab === 'notifications' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
            }`}
        >
          <Bell size={18} />
          <span>Notifications</span>
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`pb-2 px-4 flex items-center space-x-2 ${activeTab === 'privacy' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'
            }`}
        >
          <Shield size={18} />
          <span>Confidentialité</span>
        </button>
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom d'affichage</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Téléphone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Localisation</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              Enregistrer les modifications
            </button>
          </form>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Préférences de notification</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.notifications.email}
                  onChange={() => handleNotificationChange('email')}
                  className="rounded text-blue-500"
                />
                <span>Notifications par email</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.notifications.push}
                  onChange={() => handleNotificationChange('push')}
                  className="rounded text-blue-500"
                />
                <span>Notifications push</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.notifications.matches}
                  onChange={() => handleNotificationChange('matches')}
                  className="rounded text-blue-500"
                />
                <span>Nouveaux matchs</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.notifications.applications}
                  onChange={() => handleNotificationChange('applications')}
                  className="rounded text-blue-500"
                />
                <span>Mises à jour des candidatures</span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Paramètres de confidentialité</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Visibilité du profil</label>
                <select
                  value={formData.privacy.profileVisibility}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    privacy: {
                      ...prev.privacy,
                      profileVisibility: e.target.value
                    }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Privé</option>
                  <option value="connections">Connexions uniquement</option>
                </select>
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.privacy.showEmail}
                  onChange={() => handlePrivacyChange('showEmail')}
                  className="rounded text-blue-500"
                />
                <span>Afficher mon email</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.privacy.showPhone}
                  onChange={() => handlePrivacyChange('showPhone')}
                  className="rounded text-blue-500"
                />
                <span>Afficher mon numéro de téléphone</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
