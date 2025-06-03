import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, updateEmail } from 'firebase/auth';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState({
    company_name: '',
    company_description: '',
    company_website: '',
    company_location: '',
    notification_email: true,
    notification_matches: true,
    notification_messages: true
  });
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("Veuillez vous connecter");
          return;
        }

        // Récupérer les paramètres depuis Firestore
        const userDoc = await getDoc(doc(db, 'recruiters', currentUser.uid));
        if (userDoc.exists()) {
          setSettings(userDoc.data());
        }
      } catch (err) {
        console.error("Erreur lors du chargement des paramètres:", err);
        setError("Erreur lors du chargement des paramètres");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Veuillez vous connecter");
        return;
      }

      // Mettre à jour les paramètres dans Firestore
      await updateDoc(doc(db, 'recruiters', currentUser.uid), settings);
      setSuccess("Paramètres mis à jour avec succès");
    } catch (err) {
      console.error("Erreur lors de la mise à jour des paramètres:", err);
      setError("Erreur lors de la mise à jour des paramètres");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Veuillez vous connecter");
        return;
      }

      if (password.new !== password.confirm) {
        setError("Les mots de passe ne correspondent pas");
        return;
      }

      // Mettre à jour le mot de passe
      await updatePassword(currentUser, password.new);
      setSuccess("Mot de passe mis à jour avec succès");
      setPassword({ current: '', new: '', confirm: '' });
    } catch (err) {
      console.error("Erreur lors de la mise à jour du mot de passe:", err);
      setError("Erreur lors de la mise à jour du mot de passe");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mt-20 ml-8 mr-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Paramètres</h1>
        <p className="text-gray-600">Gérez vos paramètres de compte</p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Paramètres du profil */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Profil</h2>
          <form onSubmit={handleSettingsSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom de l'entreprise</label>
                <input
                  type="text"
                  name="company_name"
                  value={settings.company_name}
                  onChange={handleSettingsChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="company_description"
                  value={settings.company_description}
                  onChange={handleSettingsChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Site web</label>
                <input
                  type="url"
                  name="company_website"
                  value={settings.company_website}
                  onChange={handleSettingsChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Localisation</label>
                <input
                  type="text"
                  name="company_location"
                  value={settings.company_location}
                  onChange={handleSettingsChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </div>

        {/* Paramètres de sécurité */}
        <div className="space-y-8">
          {/* Changement de mot de passe */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Sécurité</h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mot de passe actuel</label>
                  <input
                    type="password"
                    name="current"
                    value={password.current}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                  <input
                    type="password"
                    name="new"
                    value={password.new}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    name="confirm"
                    value={password.confirm}
                    onChange={handlePasswordChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Changer le mot de passe
                </button>
              </div>
            </form>
          </div>

          {/* Paramètres de notification */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notification_email"
                  checked={settings.notification_email}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Recevoir les notifications par email
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notification_matches"
                  checked={settings.notification_matches}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Notifications de nouveaux matches
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="notification_messages"
                  checked={settings.notification_messages}
                  onChange={handleSettingsChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Notifications de nouveaux messages
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 