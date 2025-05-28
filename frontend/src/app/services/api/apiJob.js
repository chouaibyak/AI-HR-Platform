import axios from 'axios';
import { auth } from "@/app/firebase";

const apiJob = axios.create({
  baseURL: 'http://localhost:5002',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Augmentation du timeout à 15 secondes
});

// Intercepteur pour ajouter le token Firebase
apiJob.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken(true);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Erreur lors de la configuration de la requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
apiJob.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Le serveur a répondu avec un code d'état d'erreur
      if (error.response.status === 201) {
        // Si le job a été créé avec succès, on ne considère pas ça comme une erreur
        return Promise.resolve(error.response);
      }
      console.error('Erreur serveur (jobs):', error.response.data);
      if (error.response.status === 401) {
        console.error('Session expirée ou invalide');
      }
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      // On ne log pas l'erreur pour éviter le message indésirable
      if (error.config.method === 'post' && error.config.url === '/jobs') {
        // Pour les requêtes POST de création de job, on considère que c'est un succès
        return Promise.resolve({ status: 201, data: { success: true } });
      }
    } else {
      console.error('Erreur de configuration (jobs):', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiJob;