import React, { useEffect, useState } from 'react';
import { CheckCircle2, User, Briefcase, Calendar, Sparkles, Trophy, FileText } from 'lucide-react';
import { auth } from '../firebase';
import apiApplication from '../services/api/apiApplication';

export default function PlacementRecruiter() {
  const [acceptedApplications, setAcceptedApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAcceptedApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Veuillez vous connecter");
        return;
      }

      const response = await apiApplication.get(`/applications/recruiter/${currentUser.uid}`);
      const allApplications = response.data;

      // Filtrer uniquement les applications acceptées
      const accepted = allApplications.filter(app => app.status === 'accepted');
      setAcceptedApplications(accepted);
    } catch (err) {
      console.error("Erreur lors du chargement:", err);
      setError("Erreur lors du chargement des placements");
    } finally {
      setLoading(false);
    }
  };

  const handleViewCV = (cvFilename) => {
    if (!cvFilename) {
      alert("Aucun CV disponible");
      return;
    }

    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
    const uuidPart = cvFilename.split('_')[0];
    const encodedFilename = encodeURIComponent(uuidPart);

    window.open(`${apiBaseUrl}/cv/view/${encodedFilename}`, '_blank');
  };

  useEffect(() => {
    fetchAcceptedApplications();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-100 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Chargement des placements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-20 ml-8 mr-8">
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl p-8 text-center shadow-sm">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-20 ml-8 mr-8 mb-8">
      {/* Header avec design amélioré */}
      <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <div className="bg-green-100 rounded-xl p-2 mr-3">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent">
                Placements Réussis
              </h1>
            </div>
            <p className="text-slate-600 font-medium">
              Vos candidatures acceptées • {acceptedApplications.length} placement{acceptedApplications.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{acceptedApplications.length}</div>
              <div className="text-sm text-slate-500">Placement{acceptedApplications.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>

      {acceptedApplications.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-3">Aucun placement pour le moment</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Vos candidatures acceptées apparaîtront ici. Continuez à évaluer les candidatures pour créer vos premiers placements !
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {acceptedApplications.map((application) => (
            <div key={application.id} className="bg-gradient-to-r from-white to-green-50 rounded-2xl shadow-sm border border-green-200 p-6 hover:shadow-lg transition-all duration-300 group">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Badge de statut amélioré */}
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full flex items-center font-medium text-sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Placement Confirmé
                    </div>
                  </div>

                  {/* Informations du poste */}
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-green-800 transition-colors">
                      {application.job?.title}
                    </h3>
                    <p className="text-slate-600 font-medium flex items-center">
                      <Briefcase className="w-4 h-4 mr-2" />
                      {application.job?.company}
                    </p>
                  </div>

                  {/* Grille d'informations simplifiée */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/70 rounded-xl p-4 backdrop-blur-sm border border-green-100">
                      <div className="flex items-center mb-2">
                        <User className="w-4 h-4 text-green-600 mr-2" />
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Candidat Sélectionné</p>
                      </div>
                      <p className="font-bold text-slate-800 text-lg">{application.candidate?.name}</p>
                    </div>

                    <div className="bg-white/70 rounded-xl p-4 backdrop-blur-sm border border-green-100">
                      <div className="flex items-center mb-2">
                        <Calendar className="w-4 h-4 text-green-600 mr-2" />
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Date d'Acceptation</p>
                      </div>
                      <p className="font-bold text-slate-800 text-lg">
                        {new Date(application.updated_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {/* Indicateur de succès */}
                  <div className="mt-4 flex items-center text-green-600">
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Match réussi • Prêt pour l'entretien</span>
                  </div>
                </div>

                {/* Boutons d'action améliorés */}
                <div className="flex flex-col ml-6 space-y-3 min-w-[140px]">
                  <button
                    onClick={() => handleViewCV(application.cv_url)}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 text-sm font-medium border border-blue-200 transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Voir CV
                  </button>
                  {/* <button
                    onClick={() => alert('Planifier un entretien')}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Planifier entretien
                  </button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}