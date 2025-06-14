import React, { useEffect, useState } from 'react';
import apiJob from '../services/api/apiJob';
import apiApplication from '../services/api/apiApplication';
import { auth } from '../firebase';
import { MapPin, Building2, Briefcase, TrendingUp, CheckCircle, Send, Star, Clock, FileText } from 'lucide-react';
import apiCV from '../services/api/apiCV';

export default function OffreList({ onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchScores, setMatchScores] = useState({});
  const [activeCvId, setActiveCvId] = useState(localStorage.getItem("active_cv") || null);
  const [cvs, setCvs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les jobs
        const jobsResponse = await apiJob.get('/jobs');
        setJobs(jobsResponse.data);

        // Charger la liste des CVs
        const cvsResponse = await apiCV.listCVs();
        setCvs(cvsResponse.cvs);

        const activeCv = localStorage.getItem("active_cv");
        setActiveCvId(activeCv);

        if (!activeCv) {
          console.log("Aucun CV sélectionné");
          return;
        }

        // Récupérer les infos du CV
        const cvInfo = await apiCV.getCVById(activeCv);
        const cvShortId = cvInfo.saved_filename.split('_')[0];

        // Calculer les scores de matching
        const scores = {};
        for (const job of jobsResponse.data) {
          try {
            const scoreRes = await fetch(`http://localhost:5004/match/${cvShortId}/${job.id}`);
            const matchData = await scoreRes.json();
            scores[job.id] = scoreRes.ok ? matchData.match_score : null;
          } catch (e) {
            console.error(`Erreur matching job ${job.id}:`, e);
            scores[job.id] = null;
          }
        }
        setMatchScores(scores);
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Modifiez la fonction handleApply pour utiliser le CV actif
  const handleApply = async (jobId, jobTitle) => {
    const activeCvId = localStorage.getItem("active_cv");
    if (!activeCvId) {
      alert("Veuillez d'abord sélectionner un CV");
      return;
    }

    try {
      console.log("CV ID:", activeCvId);
      const cvInfo = await apiCV.getCVById(activeCvId);
      console.log("CV Info:", cvInfo);

      const cvShortId = cvInfo.saved_filename.split('_')[0];
      console.log("CV Short ID:", cvShortId);

      // Récupérer l'analyse du CV
      let analysisData = null;
      try {
        const analysisResponse = await fetch(`http://localhost:5003/get-analysis/${cvShortId}`);
        console.log("Analysis response status:", analysisResponse.status);
        if (analysisResponse.ok) {
          analysisData = await analysisResponse.json();
          console.log("Analysis data:", analysisData);
        }
      } catch (e) {
        console.error("Error fetching analysis:", e);
      }

      // Récupérer le score de matching
      let matchData = { match_score: 0 };
      try {
        const scoreRes = await fetch(`http://localhost:5004/match/${cvShortId}/${jobId}`);
        console.log("Match score response status:", scoreRes.status);
        if (scoreRes.ok) {
          matchData = await scoreRes.json();
        }
      } catch (e) {
        console.error("Error fetching match score:", e);
      }

      console.log("Sending application with data:", {
        job_id: jobId,
        job_title: jobTitle,
        candidate_id: auth.currentUser.uid,
        candidate_name: auth.currentUser.displayName || 'Anonyme',
        cv_url: cvInfo.saved_filename,
        match_score: matchData.match_score,
        skills: analysisData?.skills || [],
        summary: analysisData?.summary || '',
        cv_id: activeCvId
      });

      await apiApplication.post('/applications', {
        job_id: jobId,
        job_title: jobTitle,
        candidate_id: auth.currentUser.uid,
        candidate_name: auth.currentUser.displayName || 'Anonyme',
        cv_url: cvInfo.saved_filename,
        match_score: matchData.match_score,
        skills: analysisData?.skills || [],
        summary: analysisData?.summary || '',
        cv_id: activeCvId
      });

      alert('Candidature envoyée avec succès!');
    } catch (error) {
      console.error('Full error:', error);
      alert('Erreur lors de la candidature');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'from-emerald-500 to-green-500';
    if (score >= 60) return 'from-blue-500 to-cyan-500';
    if (score >= 40) return 'from-amber-500 to-orange-500';
    return 'from-gray-400 to-gray-500';
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'Excellent match';
    if (score >= 60) return 'Bon match';
    if (score >= 40) return 'Match modéré';
    return 'Match faible';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20 pl-30">
        <div className="text-center">
          <div className="relative ml-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Chargement des offres d'emploi...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="max-w-7xl mx-auto p-6 pt-24">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Découvrez Votre Prochaine Opportunité
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explorez des offres d'emploi personnalisées avec des scores de compatibilité basés sur votre profil
          </p>
        </div>

        {activeCvId && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-8 shadow-xl border border-blue-200">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-full p-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg">CV utilisé pour le matching</h3>
                <p className="text-blue-100 truncate">
                  {cvs.find(cv => cv.id === activeCvId)?.original_filename || "Chargement..."}
                </p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate("cv")}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Changer
              </button>
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
                <p className="text-gray-600">Offres disponibles</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 rounded-lg p-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(matchScores).filter(score => score >= 60).length}
                </p>
                <p className="text-gray-600">Bons matchs</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(matchScores).filter(score => score >= 80).length}
                </p>
                <p className="text-gray-600">Matchs excellents</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-6">
          {jobs
            .sort((a, b) => {
              const scoreA = matchScores[a.id] ?? -1;
              const scoreB = matchScores[b.id] ?? -1;
              return scoreB - scoreA;
            })
            .map(job => {
              const score = matchScores[job.id];
              const hasScore = score !== undefined && score !== null;

              return (
                <div key={job.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Top gradient bar based on score */}
                  {hasScore && (
                    <div className={`h-1 bg-gradient-to-r ${getScoreColor(score)}`}></div>
                  )}

                  <div className="p-8">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{job.company}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span>Publié récemment</span>
                              </div>
                            </div>
                          </div>

                          {/* Score badge in top right */}
                          {hasScore && (
                            <div className="text-center">
                              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${getScoreColor(score)} text-white font-bold text-lg shadow-lg`}>
                                {score}%
                              </div>
                              <p className="text-xs text-gray-500 mt-2 font-medium">
                                {getScoreBadge(score)}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                          <p className="text-gray-700 leading-relaxed">{job.description}</p>
                        </div>

                        {/* Tags or additional info could go here */}
                        <div className="flex items-center gap-2 mb-4">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            Emploi
                          </span>
                          {hasScore && score >= 70 && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              Recommandé
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="lg:flex-shrink-0 lg:w-48">
                        {hasScore && (
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-600">Score de compatibilité</span>
                            </div>
                            <div className={`text-3xl font-bold bg-gradient-to-r ${getScoreColor(score)} bg-clip-text text-transparent`}>
                              {score}%
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className={`h-2 rounded-full bg-gradient-to-r ${getScoreColor(score)}`}
                                style={{ width: `${score}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => handleApply(job.id, job.title)}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Postuler Maintenant
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Empty state if no jobs */}
        {jobs.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune offre disponible</h3>
              <p className="text-gray-600">
                Revenez plus tard pour découvrir de nouvelles opportunités !
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}