import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { auth } from '../firebase';
import apiJob from '../services/api/apiJob';
import JobList from './JobList';
import { notifyNewJob } from '../services/api/apiNotification';

export default function JobForm() {
  const [showForm, setShowForm] = useState(false);
  const [jobValue, setJobValue] = useState({
    company: '',
    description: '',
    location: '',
    skills: '',
    title: ''
  });
  const [errors, setErrors] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJobValue((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    Object.entries(jobValue).forEach(([key, value]) => {
      if (!value.trim()) {
        newErrors[key] = 'Ce champ est requis.';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const currentUser = auth.currentUser;

      if (!currentUser || !currentUser.displayName) {
        console.error("Aucun recruteur connecté ou nom non défini.");
        return;
      }

      // Récupérez le token avec les claims
      const tokenResult = await currentUser.getIdTokenResult(true);
      console.log("Token complet:", tokenResult);

      // 2. Debug complet
      console.log("Token claims:", tokenResult.claims);
      console.log("UID:", currentUser.uid);

      const jobToSend = {
        ...jobValue,
        skills: jobValue.skills.split(',').map(s => s.trim()),
        recruiter_id: currentUser.uid
      };

      const response = await apiJob.post('/jobs', jobToSend);

      await notifyNewJob({
        jobId: response.data.id,
        jobTitle: jobValue.title,
        company: jobValue.company
      });

      // Si on arrive ici, c'est que la création a réussi
      setJobValue({
        company: '',
        description: '',
        location: '',
        skills: '',
        title: ''
      });
      setErrors({});
      setShowForm(false);

      // Déclencher le rafraîchissement de la liste
      setRefreshTrigger(prev => prev + 1);

    } catch (error) {
      console.error('Erreur lors de la création du job:', error);
      if (error.response?.status === 403) {
        setErrors({ submit: 'Vous devez être recruteur pour publier une offre.' });
      } else {
        setErrors({ submit: 'Une erreur est survenue lors de la création du job.' });
      }
    }
  };

  useEffect(() => {
    if (showForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showForm]);

  return (
    <div className="min-h-screen mt-16 relative bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header */}
      <div className={`px-8 py-8 border-b border-slate-200/60 bg-white/70 backdrop-blur-sm flex items-center justify-between transition-all duration-300 ${showForm ? 'pointer-events-none' : ''} shadow-sm`}>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Offres d'emploi
          </h1>
          <p className="text-slate-600 mt-1 text-sm">Gérez et créez vos opportunités professionnelles</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5"
        >
          <PlusCircle size={22} className="group-hover:rotate-90 transition-transform duration-300" />
          Créer une offre
        </button>
      </div>

      {/* Background content */}
      <div className={`p-8 transition-all duration-300 ${showForm ? 'pointer-events-none blur-sm' : ''}`}>
        <JobList key={refreshTrigger} />
      </div>

      {/* Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Créer une nouvelle offre</h2>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Titre */}
              <div className="group">
                <label className="block text-slate-700 font-semibold mb-2 text-sm uppercase tracking-wide">
                  Titre du poste
                </label>
                <input
                  type="text"
                  name="title"
                  value={jobValue.title}
                  onChange={handleChange}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-slate-800 placeholder-slate-400 bg-slate-50/30 hover:bg-white"
                  placeholder="Ex: Développeur Full Stack Senior"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1 font-medium">{errors.title}</p>}
              </div>

              {/* Company */}
              <div className="group">
                <label className="block text-slate-700 font-semibold mb-2 text-sm uppercase tracking-wide">
                  Entreprise
                </label>
                <input
                  type="text"
                  name="company"
                  value={jobValue.company}
                  onChange={handleChange}
                  ref={inputRef}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-slate-800 placeholder-slate-400 bg-slate-50/30 hover:bg-white"
                  placeholder="Nom de l'entreprise"
                />
                {errors.company && <p className="text-red-500 text-sm mt-1 font-medium">{errors.company}</p>}
              </div>

              {/* Description */}
              <div className="group">
                <label className="block text-slate-700 font-semibold mb-2 text-sm uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  name="description"
                  value={jobValue.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-slate-800 placeholder-slate-400 bg-slate-50/30 hover:bg-white resize-none"
                  placeholder="Décrivez le poste, les responsabilités et les missions..."
                />
                {errors.description && <p className="text-red-500 text-sm mt-1 font-medium">{errors.description}</p>}
              </div>

              {/* Location */}
              <div className="group">
                <label className="block text-slate-700 font-semibold mb-2 text-sm uppercase tracking-wide">
                  Localisation
                </label>
                <input
                  type="text"
                  name="location"
                  value={jobValue.location}
                  onChange={handleChange}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-slate-800 placeholder-slate-400 bg-slate-50/30 hover:bg-white"
                  placeholder="Paris, France • Télétravail possible"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1 font-medium">{errors.location}</p>}
              </div>

              {/* Skills */}
              <div className="group">
                <label className="block text-slate-700 font-semibold mb-2 text-sm uppercase tracking-wide">
                  Compétences requises
                </label>
                <input
                  type="text"
                  name="skills"
                  value={jobValue.skills}
                  onChange={handleChange}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200 text-slate-800 placeholder-slate-400 bg-slate-50/30 hover:bg-white"
                  placeholder="React, Node.js, TypeScript, PostgreSQL..."
                />
                <p className="text-slate-500 text-xs mt-1">Séparez les compétences par des virgules</p>
                {errors.skills && <p className="text-red-500 text-sm mt-1 font-medium">{errors.skills}</p>}
              </div>

              {/* Error message */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {errors.submit}
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-slate-600 hover:text-slate-800 font-semibold rounded-xl hover:bg-slate-100 transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Publier l'offre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}