import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { auth } from '../firebase';
import apiJob from '../services/api/apiJob';
import JobList from './JobList';

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

      const jobToSend = {
        ...jobValue,
        skills: jobValue.skills.split(',').map(s => s.trim()),
        recruiter_id: currentUser.uid
      };

      const response = await apiJob.post('/jobs', jobToSend);

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
      setErrors({ submit: 'Une erreur est survenue lors de la création du job.' });
    }
  };

  useEffect(() => {
    if (showForm && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showForm]);

  return (
    <div className="min-h-screen mt-16 relative">
      {/* Header */}
      <div className={`px-6 py-6  border-b border-gray-300 bg-gray-100 flex items-center justify-between transition-all duration-300 ${showForm ? 'pointer-events-none' : ''}`}>
        <h1 className="text-3xl  font-bold text-gray-800">Jobs</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md shadow-md transition duration-300 cursor-pointer"
        >
          <PlusCircle size={20} />
          Créer une offre
        </button>
      </div>

      {/* Background content placeholder */}
      <div className={`p-6 transition-all duration-300 ${showForm ? 'pointer-events-none' : ''}`}>
        <JobList key={refreshTrigger} />
      </div>

      {/* Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-white/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-xl mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Créer une nouvelle offre</h2>
            <form className="space-y-5" onSubmit={handleSubmit}>

              {/* Titre */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Titre</label>
                <input
                  type="text"
                  name="title"
                  value={jobValue.title}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Développeur Full Stack"
                />
                {errors.title && <p className="text-red-600 text-sm">{errors.title}</p>}
              </div>

              {/* Company */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Entreprise</label>
                <input
                  type="text"
                  name="company"
                  value={jobValue.company}
                  onChange={handleChange}
                  ref={inputRef}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de l'entreprise"
                />
                {errors.company && <p className="text-red-600 text-sm">{errors.company}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Description</label>
                <input
                  type="text"
                  name="description"
                  value={jobValue.description}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Description du poste"
                />
                {errors.description && <p className="text-red-600 text-sm">{errors.description}</p>}
              </div>

              {/* Location */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Localisation</label>
                <input
                  type="text"
                  name="location"
                  value={jobValue.location}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Lieu de travail"
                />
                {errors.location && <p className="text-red-600 text-sm">{errors.location}</p>}
              </div>

              {/* Skills */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Compétences</label>
                <input
                  type="text"
                  name="skills"
                  value={jobValue.skills}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: React, Python, MySQL"
                />
                {errors.skills && <p className="text-red-600 text-sm">{errors.skills}</p>}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}