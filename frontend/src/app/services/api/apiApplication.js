import axios from 'axios';
import { auth } from "@/app/firebase";

const apiApplication = axios.create({
  baseURL: 'http://localhost:5005', // Assure-toi que ce port correspond
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 secondes de timeout
});

// Intercepteur pour ajouter le token Firebase
apiApplication.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
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
apiApplication.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Le serveur a répondu avec un code d'état d'erreur
      console.error('Erreur serveur (applications):', error.response.data);
      if (error.response.status === 401) {
        // Token expiré ou invalide
        console.error('Session expirée ou invalide');
      }
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      console.error('Pas de réponse du serveur (applications). Vérifiez que le serveur est en cours d\'exécution sur le port 5005');
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      console.error('Erreur de configuration (applications):', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiApplication;