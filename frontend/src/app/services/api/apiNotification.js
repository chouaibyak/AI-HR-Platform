// apiNotification.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5008';

export const notifyNewJob = async (jobData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/notify/new-job`,
      jobData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur détaillée:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    throw error;
  }
};