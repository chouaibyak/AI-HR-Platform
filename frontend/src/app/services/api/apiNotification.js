import axios from 'axios';

const API_BASE_URL = 'http://localhost:5008';

export const notifyNewJob = async (jobData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/notify/new-job`, jobData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l’envoi de la notification:', error);
    throw error;
  }
};

// Récupère les notifications d’un utilisateur
export const getUserNotifications = async (userId) => {
  const response = await axios.get(`${API_BASE_URL}/notifications/user/${userId}`);
  return response.data;
};

// Marque une notification comme lue
export const markNotificationAsRead = async (notificationId) => {
  const response = await axios.put(
    `${API_BASE_URL}/notifications/${notificationId}/read`
  );
  return response.data;
};