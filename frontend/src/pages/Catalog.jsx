import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

export default function Catalog() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // États pour la modale (fenêtre pop-up) de la clé secrète
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [accessKey, setAccessKey] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // 1. Récupérer toutes les formations au chargement de la page
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('https://fdb-formations-production.up.railway.app/api/courses');
        setCourses(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des formations", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // 2. Fonction pour tenter de débloquer la formation
  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockError('');
    setIsUnlocking(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/'); // Retour au login si non connecté
        return;
      }

      // Appel à ton API de déblocage avec le Token dans l'en-tête (Header)
      await axios.post(
        `https://fdb-formations-production.up.railway.app/api/courses/${selectedCourse.id}/unlock`,
        { key: accessKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Succès ! Vous avez débloqué la formation : ${selectedCourse.title}`);
      setSelectedCourse(null); // On ferme la modale
      setAccessKey(''); // On vide le champ
      navigate('/dashboard'); // On le renvoie vers son tableau de bord

    } catch (error) {
      setUnlockError(error.response?.data?.message || "Erreur lors du déblocage.");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* En-tête de la page */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Catalogue des Formations</h1>
            <p className="text-slate-500 mt-2">Découvrez nos parcours techniques et débloquez-les avec votre clé d'accès.</p>
          </div>
          <Link to="/dashboard" className="text-blue-600 font-bold hover:underline">
            Retour au Dashboard
          </Link>
        </div>

        {/* Grille des formations */}
        {isLoading ? (
          <p className="text-center text-slate-500 mt-20">Chargement des formations...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden group">
                
                {/* LA NOUVELLE IMAGE DE COUVERTURE */}
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <img 
                    src={course.imageUrl} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Petit badge gratuit */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-600">
                    Gratuit
                  </div>
                </div>

                {/* LE TEXTE EN DESSOUS */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-2 line-clamp-1">{course.title}</h3>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 flex-1">{course.description}</p>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center text-slate-600">
                        {course.instructor?.name?.charAt(0) || "P"}
                      </div>
                      {course.instructor?.name || "Professeur"}
                    </span>
                    <button 
                      onClick={() => setSelectedCourse(course)}
                      className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors"
                    >
                      Débloquer
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* LA MODALE (FENÊTRE) DE LA CLÉ SECRÈTE */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-2">Clé d'accès requise</h3>
            <p className="text-slate-500 text-sm mb-6">
              Entrez le code secret pour débloquer <strong>{selectedCourse.title}</strong>.
            </p>

            {unlockError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100">
                {unlockError}
              </div>
            )}

            <form onSubmit={handleUnlock}>
              <input 
                type="text" 
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="Ex: REACT2026"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none mb-4 font-mono uppercase"
                required
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setSelectedCourse(null); setUnlockError(''); setAccessKey(''); }}
                  className="w-1/2 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isUnlocking}
                  className="w-1/2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-70 flex justify-center items-center"
                >
                  {isUnlocking ? "Vérification..." : "Débloquer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}