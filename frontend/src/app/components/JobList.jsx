import React, { useEffect, useState } from 'react';
import apiJob from '../services/api/apiJob';
import { Trash2, Pencil } from 'lucide-react';
import { auth } from '../firebase';

export default function JobList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [editValues, setEditValues] = useState({ title: '', company: '', location: '', description: '', skills: '' });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('Utilisateur non connecté');
        return;
      }

      // Utilisez la route spécifique pour les jobs du recruteur
      const response = await apiJob.get(`/jobs/recruiter/${currentUser.uid}`);
      setJobs(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des jobs :', err);
      setError('Impossible de récupérer vos offres.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Confirmez-vous la suppression de cette offre ?")) return;

    try {
      await apiJob.delete(`/jobs/${id}`);
      setJobs(jobs.filter(job => job.id !== id));
    } catch (err) {
      console.error('Erreur lors de la suppression :', err);
    }
  };

  const handleEdit = (job) => {
    setEditingJobId(job.id);
    setEditValues({
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      skills: job.skills.join(', ')
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (id) => {
    try {
      const updatedJob = {
        ...editValues,
        skills: editValues.skills.split(',').map(s => s.trim()),
      };

      await apiJob.put(`/jobs/${id}`, updatedJob);
      setEditingJobId(null);
      fetchJobs();
    } catch (err) {
      console.error("Erreur lors de la mise à jour :", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement des offres...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-6 mx-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">⚠</span>
          </div>
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
          Vos offres d'emploi
        </h2>
        <p className="text-slate-600">Gérez et modifiez vos offres publiées</p>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200/50">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-slate-400 text-2xl">📋</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Aucune offre disponible</h3>
          <p className="text-slate-500">Commencez par créer votre première offre d'emploi</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="group bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden hover:-translate-y-1"
            >
              <div className="p-6 relative">
                {/* Actions Buttons */}
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => handleEdit(job)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {editingJobId === job.id ? (
                  <div className="space-y-4">
                    <input
                      name="title"
                      value={editValues.title}
                      onChange={handleEditChange}
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
                      placeholder="Titre du poste"
                    />
                    <input
                      name="company"
                      value={editValues.company}
                      onChange={handleEditChange}
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
                      placeholder="Entreprise"
                    />
                    <input
                      name="location"
                      value={editValues.location}
                      onChange={handleEditChange}
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
                      placeholder="Localisation"
                    />
                    <textarea
                      name="description"
                      value={editValues.description}
                      onChange={handleEditChange}
                      rows="2"
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm resize-none"
                      placeholder="Description"
                    />
                    <input
                      name="skills"
                      value={editValues.skills}
                      onChange={handleEditChange}
                      className="w-full border-2 border-slate-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
                      placeholder="Compétences (séparées par des virgules)"
                    />
                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setEditingJobId(null)}
                        className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg hover:bg-slate-100 transition-all"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleUpdate(job.id)}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors duration-200 pr-16">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="font-medium">{job.company}</span>
                        <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                        <span>{job.location}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {job.description}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {job.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-full border border-blue-200/50 hover:from-blue-100 hover:to-blue-200 transition-all"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Footer gradient line */}
                    <div className="w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}