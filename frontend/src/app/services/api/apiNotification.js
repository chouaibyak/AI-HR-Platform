import axios from 'axios';
import { auth } from '@/app/firebase';

// Création d'une instance Axios configurée
const apiNotification = axios.create({
  baseURL: 'http://localhost:5008',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter automatiquement le token Firebase
apiNotification.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fonction pour créer une notification
export const notifyNewJob = async (jobData) => {
  try {
    const response = await apiNotification.post('/notify/new-job', jobData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l’envoi de la notification:', error);
    throw error;
  }
};

// Récupère les notifications d’un utilisateur
export const getUserNotifications = async (userId) => {
  try {
    const response = await apiNotification.get(`/notifications/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return [];
  }
};

// Marque une notification comme lue
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await apiNotification.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    throw error;
  }
};

export default apiNotification;