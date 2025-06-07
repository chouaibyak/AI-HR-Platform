const API_BASE_URL = 'http://127.0.0.1:5001/cv';
const ANALYZER_API_URL = 'http://127.0.0.1:5003';

const apiCV = {
  uploadCV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur serveur:', errorText);
      throw new Error("Erreur lors de l'envoi du CV");
    }

    return response.json();
  },

  // Nouvelle méthode pour lister les CVs
  listCVs: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/list`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur serveur: ${errorText}`);
      }

      const data = await response.json();

      // Trier les CVs par date d'upload (du plus récent au plus ancien)
      if (data.cvs && data.cvs.length > 0) {
        data.cvs.sort((a, b) =>
          new Date(b.upload_time) - new Date(a.upload_time)
        );
      }

      return data;
    } catch (error) {
      console.error("Erreur dans listCVs:", error);
      throw error;
    }
  },

  downloadCV: (filename) => {
    const downloadUrl = `${API_BASE_URL}/download/${filename}`;
    window.open(downloadUrl, '_blank');
  },

  deleteCV: async (filename) => {
    const response = await fetch(`${API_BASE_URL}/delete/${filename}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression du fichier");
    }

    return response.json();
  },

  analyzeCV: async (filename) => {
    try {
      const res = await fetch(`${ANALYZER_API_URL}/analyze-from-cvservice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur analyse: ${text}`);
      }

      return await res.json();
    } catch (error) {
      console.error("→ Erreur réseau API analyseCV:", error);
      throw error;
    }
  },

  getAllAnalyses: async () => {
    const res = await fetch(`${ANALYZER_API_URL}/analyses`);
    if (!res.ok) throw new Error("Erreur récupération analyses");
    return res.json();
  },

  // Méthode utilitaire GET générique
  get: async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur lors de la requête GET: ${response.statusText}`);
    }
    return response.json();
  },


  getCVById: async (cvId) => {
    const response = await fetch(`${API_BASE_URL}/get/${cvId}`);
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération du CV");
    }
    return response.json();
  },
};

export default apiCV;