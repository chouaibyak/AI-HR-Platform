const API_BASE_URL = 'http://127.0.0.1:5001/cv';

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
      throw new Error('Erreur lors de l’envoi du CV');
    }

    return response.json();
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
      const res = await fetch(`http://127.0.0.1:5003/analyze-from-cvservice`, {
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
    const res = await fetch('http://127.0.0.1:5003/analyses');
    if (!res.ok) throw new Error("Erreur récupération analyses");
    return res.json();
  },

};

export default apiCV;
