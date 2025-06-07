import React, { useState, useEffect } from 'react';
import { FileText, ChevronRight, Download, Trash2, Upload } from 'lucide-react';
import apiCV from '../services/api/apiCV';

export default function UploadCV() {
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [cvs, setCvs] = useState([]);
  const [selectedCv, setSelectedCv] = useState(null);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' ou 'list'
  const [isUploading, setIsUploading] = useState(false);
  const [activeCvId, setActiveCvId] = useState(localStorage.getItem("active_cv") || null);


  const handleSelectCv = (cv) => {
    setSelectedCv(cv);
    setActiveCvId(cv.id);
    localStorage.setItem("active_cv", cv.id);

    // Stocker aussi le nom de fichier pour le matching
    localStorage.setItem("last_uploaded_cv", cv.saved_filename);

    // Charger l'analyse si disponible
    if (cv.saved_filename.startsWith(localStorage.getItem("last_uploaded_cv"))) {
      const savedAnalysis = localStorage.getItem("cv_analysis");
      if (savedAnalysis) {
        setAnalysis(JSON.parse(savedAnalysis));
      }
    } else {
      setAnalysis(null);
    }
  };


  // Charger la liste des CVs et l'analyse sauvegardée
  useEffect(() => {
    const fetchCVs = async () => {
      try {
        const response = await apiCV.listCVs();
        setCvs(response.cvs);

        // Sélectionner le CV actif s'il existe, sinon le premier CV
        const activeCv = response.cvs.find(cv => cv.id === activeCvId) ||
          (response.cvs.length > 0 ? response.cvs[0] : null);
        setSelectedCv(activeCv);

        if (activeCv) {
          localStorage.setItem("active_cv", activeCv.id);
          localStorage.setItem("last_uploaded_cv", activeCv.saved_filename);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des CVs:", err);
      }
    };


    const savedAnalysis = localStorage.getItem("cv_analysis");
    if (savedAnalysis) {
      setAnalysis(JSON.parse(savedAnalysis));
    }

    fetchCVs();
  }, [activeCvId]);

  const handleFileUpload = async (e) => {
    if (isUploading) return;

    const file = e.target.files[0];
    if (!file) {
      setUploadStatus("Aucun fichier sélectionné.");
      return;
    }

    setIsUploading(true);
    setIsLoading(true);
    setUploadStatus("Envoi du CV en cours...");
    setAnalysis(null);

    try {
      const uploadResponse = await apiCV.uploadCV(file);
      setUploadStatus("CV bien uploadé. Analyse en cours...");

      // Mettre à jour la liste des CVs
      const listResponse = await apiCV.listCVs();
      setCvs(listResponse.cvs);

      // Trouver le CV fraîchement uploadé
      const newCv = listResponse.cvs.find(cv => cv.saved_filename === uploadResponse.filename);
      setSelectedCv(newCv);
      setActiveTab('list');

      // Stocker le CV actif
      localStorage.setItem("active_cv", newCv.id);

      const analyzeResponse = await apiCV.analyzeCV(uploadResponse.filename);
      setUploadStatus("Analyse terminée !");
      setAnalysis(analyzeResponse.parsed_analysis);

      // Sauvegarder l'analyse
      localStorage.setItem("cv_analysis", JSON.stringify(analyzeResponse.parsed_analysis));
      localStorage.setItem("last_uploaded_cv", uploadResponse.filename.split("_")[0]);

      // MATCH automatique avec toutes les offres
      setUploadStatus("Calcul des scores de compatibilité...");
      try {
        const cvId = uploadResponse.filename.split("_")[0];
        await fetch(`http://localhost:5004/match_all_jobs/${cvId}`);
        setUploadStatus("Analyse et matching terminés !");
      } catch (matchError) {
        console.error("Erreur lors du matching:", matchError);
        setUploadStatus("Analyse terminée mais erreur lors du matching.");
      }
    } catch (error) {
      console.error("Erreur:", error);
      setUploadStatus("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Dans UploadCV.js, modifiez la fonction handleDelete
  const handleDelete = async (cvId, filename) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce CV ?")) {
      try {
        await apiCV.deleteCV(filename);

        // Mettre à jour la liste des CVs
        const updatedList = cvs.filter(cv => cv.id !== cvId);
        setCvs(updatedList);

        // Gérer la sélection courante
        if (selectedCv?.id === cvId) {
          setSelectedCv(updatedList[0] || null);

          // Si c'était le CV analysé, nettoyer le localStorage
          const lastUploadedCv = localStorage.getItem("last_uploaded_cv");
          if (lastUploadedCv && filename.startsWith(lastUploadedCv)) {
            localStorage.removeItem("cv_analysis");
            localStorage.removeItem("last_uploaded_cv");
            setAnalysis(null);
          }
        }
      } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        alert("Erreur lors de la suppression. Veuillez réessayer.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-100">
      <div className="pt-12 pb-20 px-6 max-w-7xl mx-auto">
        {/* Header avec animation */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl font-black bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent mb-4">
            Gestion des CVs
          </h1>
          <p className="text-xl text-gray-600 font-medium">
            Uploadez votre CV et découvrez des insights personnalisés
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto mt-6 rounded-full"></div>
        </div>

        {/* Navigation par onglets avec design moderne */}
        <div className="flex justify-center mb-10">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 shadow-xl border border-white/20">
            <div className="flex space-x-1">
              <button
                className={`px-8 py-4 font-semibold rounded-xl transition-all duration-300 flex items-center space-x-3 ${activeTab === 'upload'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
                onClick={() => setActiveTab('upload')}
              >
                <Upload size={22} />
                <span>Uploader un CV</span>
              </button>
              <button
                className={`px-8 py-4 font-semibold rounded-xl transition-all duration-300 flex items-center space-x-3 ${activeTab === 'list'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
                onClick={() => setActiveTab('list')}
              >
                <FileText size={22} />
                <span>Mes CVs ({cvs.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="transition-all duration-500 ease-in-out">
          {activeTab === 'upload' ? (
            <div className="max-w-2xl mx-auto">
              <div className="group relative bg-white/80 backdrop-blur-sm border-4 border-dashed border-blue-300 p-16 rounded-3xl shadow-2xl transition-all duration-300 hover:shadow-3xl hover:border-blue-400 hover:bg-white/90">
                {/* Effet de lueur en arrière-plan */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-blue-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="relative flex flex-col items-center justify-center space-y-6">
                  <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <FileText className="text-4xl text-white" />
                  </div>

                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="cv-upload"
                  />

                  <label htmlFor="cv-upload" className="text-center cursor-pointer group">
                    <div className="text-2xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                      <span className="bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                        Choisissez un fichier
                      </span> ou déposez-le ici
                    </div>
                    <div className="text-gray-500 font-medium">
                      Formats acceptés: PDF uniquement
                    </div>
                  </label>
                </div>

                {/* Statut avec design amélioré */}
                {uploadStatus && (
                  <div className="mt-8 text-center">
                    <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 rounded-2xl border border-blue-200">
                      {isLoading && (
                        <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      )}
                      <span className="text-lg font-semibold text-gray-800">{uploadStatus}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
              {/* Liste des CVs avec design premium */}
              <div className="w-full lg:w-1/3">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                    <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
                      <FileText size={28} />
                      <span>Vos CVs</span>
                    </h2>
                  </div>

                  <div className="p-4">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {cvs.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="text-gray-400" size={32} />
                          </div>
                          <p className="text-gray-500 font-medium">Aucun CV uploadé</p>
                        </div>
                      ) : (
                        cvs.map(cv => (
                          <div
                            key={cv.id}
                            onClick={() => handleSelectCv(cv)}
                            className={`group p-4 rounded-xl cursor-pointer transition-all duration-300 ${selectedCv?.id === cv.id
                                ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-300 shadow-lg'
                                : 'hover:bg-gray-50 hover:shadow-md border-2 border-transparent'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-lg ${selectedCv?.id === cv.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                                  }`}>
                                  <FileText size={20} />
                                </div>
                                <div>
                                  <span className="font-medium text-gray-800 truncate">{cv.original_filename}</span>
                                  {selectedCv?.id === cv.id && (
                                    <span className="block text-xs text-blue-600 font-medium mt-1">CV actif</span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight
                                className={`transition-transform duration-300 ${selectedCv?.id === cv.id
                                    ? 'text-blue-500 transform rotate-90'
                                    : 'text-gray-400 group-hover:translate-x-1'
                                  }`}
                                size={20}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails du CV avec design moderne */}
              <div className="w-full lg:w-2/3">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                  {selectedCv ? (
                    <>
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                        <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-bold text-white truncate mr-4">{selectedCv.original_filename}</h2>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => apiCV.downloadCV(selectedCv.saved_filename)}
                              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-300 hover:scale-110"
                              title="Télécharger"
                            >
                              <Download className="text-white" size={20} />
                            </button>
                            <button
                              onClick={() => handleDelete(selectedCv.id, selectedCv.saved_filename)}
                              className="p-3 bg-red-500/80 hover:bg-red-500 rounded-xl transition-all duration-300 hover:scale-110"
                              title="Supprimer"
                            >
                              <Trash2 className="text-white" size={20} />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">Date d'upload</h3>
                          <p className="text-gray-600 font-medium">
                            {new Date(selectedCv.upload_time).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-4">Aperçu du document</h3>
                          <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-inner">
                            <iframe
                              src={`http://localhost:5001/cv/view/${selectedCv.saved_filename.split('_')[0]}`}
                              className="w-full h-96"
                              title="CV Preview"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="text-blue-500" size={40} />
                        </div>
                        <p className="text-xl font-medium text-gray-500">
                          {cvs.length === 0 ? "Aucun CV disponible" : "Sélectionnez un CV pour voir les détails"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedback analysé avec design premium */}
        {analysis && (
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 p-8">
                <h2 className="text-4xl font-bold text-center text-white mb-2">
                  Analyse de votre CV
                </h2>
                <div className="w-16 h-1 bg-white/50 mx-auto rounded-full"></div>
              </div>

              <div className="p-8 space-y-8">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    Compétences identifiées
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skills.map((skill, index) => (
                      <span key={index} className="px-4 py-2 bg-white border border-green-200 rounded-full text-gray-700 font-medium shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    Expérience professionnelle
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">{analysis.experience}</p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    Résumé du profil
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-lg">{analysis.summary}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}