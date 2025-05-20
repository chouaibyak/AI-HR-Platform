import React, { useEffect, useState } from 'react';
import apiJob from '../services/api/apiJob';
import { Trash2, Pencil } from 'lucide-react';

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
      const response = await apiJob.get('/jobs');
      setJobs(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des jobs :', err);
      setError('Impossible de récupérer les offres.');
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

  if (loading) return <p className="text-center mt-10">Chargement des offres...</p>;
  if (error) return <p className="text-red-600 text-center mt-10">{error}</p>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Offres disponibles</h2>

      {jobs.length === 0 ? (
        <p className="text-gray-600">Aucune offre disponible pour le moment.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="border p-4 rounded-lg shadow-sm bg-white relative">

              {/* Icones Modifier et Supprimer */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button onClick={() => handleEdit(job)} className="text-gray-500 hover:text-gray-900 cursor-pointer">
                  <Pencil size={18} />
                </button>
                <button onClick={() => handleDelete(job.id)} className="text-red-600 hover:text-red-800 cursor-pointer">
                  <Trash2 size={18} />
                </button>
              </div>

              {editingJobId === job.id ? (
                <div className="space-y-2">
                  <input
                    name="title"
                    value={editValues.title}
                    onChange={handleEditChange}
                    className="w-full border px-2 py-1 rounded"
                  />
                  <input
                    name="company"
                    value={editValues.company}
                    onChange={handleEditChange}
                    className="w-full border px-2 py-1 rounded"
                  />
                  <input
                    name="location"
                    value={editValues.location}
                    onChange={handleEditChange}
                    className="w-full border px-2 py-1 rounded"
                  />
                  <input
                    name="description"
                    value={editValues.description}
                    onChange={handleEditChange}
                    className="w-full border px-2 py-1 rounded"
                  />
                  <input
                    name="skills"
                    value={editValues.skills}
                    onChange={handleEditChange}
                    className="w-full border px-2 py-1 rounded"
                    placeholder="Ex: React, Node.js"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setEditingJobId(null)} className="text-sm text-gray-600 hover:text-gray-800">
                      Annuler
                    </button>
                    <button
                      onClick={() => handleUpdate(job.id)}
                      className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-blue-700">{job.title}</h3>
                  <p className="text-gray-700">{job.company} - {job.location}</p>
                  <p className="text-gray-600 mt-2">{job.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span key={index} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
