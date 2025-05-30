import React, { useEffect, useState } from 'react';
import apiJob from '../services/api/apiJob';
import apiApplication from '../services/api/apiApplication';
import { auth } from '../firebase';

export default function OffreList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchScores, setMatchScores] = useState({});

  useEffect(() => {
    const fetchJobsAndScores = async () => {
      try {
        const response = await apiJob.get('/jobs');
        const jobsData = response.data;
        setJobs(jobsData);

        const storedCV = localStorage.getItem("last_uploaded_cv");
        console.log("CV stocké:", storedCV);

        if (!storedCV) {
          console.log("Aucun CV trouvé dans le localStorage");
          return;
        }

        // Extraire l'ID du CV du nom du fichier (première partie avant le premier underscore)
        const cvId = storedCV.split("_")[0];
        console.log("ID du CV extrait:", cvId);

        const scores = {};
        for (const job of jobsData) {
          try {
            console.log(`Récupération du score pour le job ${job.id} avec le CV ${cvId}`);
            const scoreRes = await fetch(`http://localhost:5004/match/${cvId}/${job.id}`);
            const matchData = await scoreRes.json();

            if (scoreRes.ok) {
              console.log(`Score trouvé pour le job ${job.id}:`, matchData.match_score);
              scores[job.id] = matchData.match_score;
            } else {
              console.error(`Erreur de matching pour le job ${job.id}:`, matchData.error);
              scores[job.id] = null;
            }
          } catch (e) {
            console.error(`Erreur lors du matching pour le job ${job.id}:`, e);
            scores[job.id] = null;
          }
        }
        console.log("Scores finaux:", scores);
        setMatchScores(scores);
      } catch (err) {
        console.error('Erreur lors de la récupération des offres:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobsAndScores();
  }, []);

  const handleApply = async (jobId, jobTitle) => {
    const storedCV = localStorage.getItem("last_uploaded_cv");
    const currentUser = auth.currentUser;

    if (!storedCV) {
      alert("Veuillez d'abord déposer votre CV");
      return;
    }

    try {
      await apiApplication.post('/applications', {
        job_id: jobId,
        job_title: jobTitle,
        candidate_id: currentUser.uid,
        candidate_name: currentUser.displayName || 'Anonyme',
        cv_url: storedCV
      });
      alert('Candidature envoyée!');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la candidature');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-blue-50 opacity-20 animate-pulse"></div>
          </div>
          <p className="mt-6 text-xl font-medium text-gray-700">Chargement des offres...</p>
          <p className="mt-2 text-sm text-gray-500">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-6 pt-24">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Offres disponibles</h2>

        {localStorage.getItem("last_uploaded_cv") && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 font-medium">
              ✓ CV déjà enregistré : {localStorage.getItem("last_uploaded_cv")}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {jobs
            .sort((a, b) => {
              const scoreA = matchScores[a.id] ?? -1;
              const scoreB = matchScores[b.id] ?? -1;
              return scoreB - scoreA;
            })
            .map(job => (
              <div key={job.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-bold text-blue-700">{job.title}</h3>

                      </div>

                      <div className="flex items-center text-gray-600 mb-3">
                        <span className="font-medium">{job.company}</span>
                        <span className="mx-2">•</span>
                        <span>{job.location}</span>
                      </div>

                      <p className="text-gray-700 leading-relaxed mb-4">{job.description}</p>
                    </div>

                    <div className="lg:ml-6 lg:flex-shrink-0">
                      {matchScores[job.id] !== undefined && (
                        <div className="text-center mb-4">
                          <p className={`text-2xl font-bold ${matchScores[job.id] >= 70 ? 'text-green-600' :
                            matchScores[job.id] >= 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {matchScores[job.id] ?? 'N/A'}%
                          </p>
                          <p className="text-sm text-gray-500">Compatibilité</p>
                        </div>
                      )}

                      <button
                        onClick={() => handleApply(job.id, job.title)}
                        className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Postuler
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}