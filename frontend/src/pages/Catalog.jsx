import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Catalog() {
  const navigate = useNavigate();
  const { token } = useAuthStore(); // On récupère le token depuis Zustand
  
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]); // Les branches
  const [isLoading, setIsLoading] = useState(true);
  
  // État de navigation interne : null = vue Branches, ID = vue des cours de cette branche, "OTHER" = vue "Autres"
  const [selectedCategoryId, setSelectedCategoryId] = useState(null)

  // États pour la modale de clé secrète
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [accessKey, setAccessKey] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // On récupère les cours ET les branches en même temps !
        const [coursesRes, categoriesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/courses'),
          axios.get('http://localhost:5000/api/categories')
        ]);
        
        setCourses(coursesRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error("Erreur de chargement", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlockError('');
    setIsUnlocking(true);

    try {
      const activeToken = token || localStorage.getItem('token');
      if (!activeToken) {
        navigate('/login'); 
        return;
      }

      await axios.post(`http://localhost:5000/api/courses/${selectedCourse.id}/unlock`, { key: accessKey }, { 
        headers: { Authorization: `Bearer ${activeToken}` } 
      });

      alert(`Succès ! Vous avez débloqué : ${selectedCourse.title}`);
      setSelectedCourse(null);
      setAccessKey('');
      navigate('/dashboard'); 

    } catch (error) {
      setUnlockError(error.response?.data?.message || "Erreur lors du déblocage.");
    } finally {
      setIsUnlocking(false);
    }
  };

   // Calcul du nombre de cours sans branche ("Autres")
  const otherCourses = courses.filter(c => !c.categoryId);

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* En-tête */}
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Catalogue</h1>
          <p className="text-slate-500 mt-2 text-lg">
            {selectedCategoryId === null ? "Choisissez votre domaine d'apprentissage." : "Découvrez les formations de cette branche."}
          </p>
        </div>
        {selectedCategoryId !== null && (
          <button onClick={() => setSelectedCategoryId(null)} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 flex items-center gap-2">
            <span>←</span> Retour aux branches
          </button>
        )}
      </div>

      {/* GRILLE DES FORMATIONS FILTRÉES */}
      {isLoading ? (
        <p className="text-center font-bold mt-20">Chargement...</p>
      ) : selectedCategoryId === null ? (
        
        // --- VUE 1 : LES BRANCHES (DESIGN PREMIUM) ---
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {categories.map(cat => {
            // On calcule le nombre de cours dans cette branche
            const branchCourses = courses.filter(c => c.categoryId === cat.id);
            const courseCount = branchCourses.length;

            return (
              <div 
                key={cat.id} 
                onClick={() => setSelectedCategoryId(cat.id)}
                className="group relative bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-blue-600/10 transition-all duration-500 cursor-pointer flex flex-col hover:-translate-y-1"
              >
                {/* Image avec dégradé sombre en bas */}
                <div className="h-52 relative overflow-hidden bg-slate-100 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-90"></div>
                  <img 
                    src={cat.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt={cat.name} 
                  />
                  
                  {/* Petit badge en haut */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-black rounded-full border border-white/30 shadow-sm">
                      Spécialité
                    </span>
                  </div>

                  {/* Titre superposé sur l'image */}
                  <div className="absolute bottom-5 left-6 right-6 z-20">
                    <h3 className="text-2xl font-black text-white drop-shadow-md group-hover:text-blue-300 transition-colors">
                      {cat.name}
                    </h3>
                  </div>
                </div>

                {/* Contenu et Infos Supplémentaires */}
                <div className="p-6 flex flex-col flex-1 bg-white relative">
                  
                  {/* Bouton d'action flottant (Cercle avec flèche) */}
                  <div className="absolute -top-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-blue-700 transition-all duration-300 z-30">
                    <span className="font-bold text-xl group-hover:translate-x-1 transition-transform">→</span>
                  </div>

                  {/* Statistiques et infos de la branche */}
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-lg">
                        📚
                      </div>
                      <span><strong>{courseCount}</strong> formation(s) incluse(s)</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 text-lg">
                        🤝
                      </div>
                      <span>De Débutant à Expert</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                      <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0 text-lg">
                        ⚡
                      </div>
                      <span>Apprentissage à votre rythme</span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
          
          {/* --- CARTE SPÉCIALE "AUTRES FORMATIONS" (Si formations sans branche) --- */}
          {otherCourses.length > 0 && (
             <div 
               onClick={() => setSelectedCategoryId('OTHER')} 
               className="group relative bg-slate-900 rounded-[2rem] border border-slate-700 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-900/50 transition-all duration-500 cursor-pointer flex flex-col hover:-translate-y-1"
             >
               {/* Fond sombre texturé */}
               <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800')] bg-cover bg-center mix-blend-overlay"></div>
               
               <div className="h-52 relative overflow-hidden p-6 flex flex-col justify-end z-10">
                 <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-black rounded-full border border-white/20">
                      Général
                    </span>
                  </div>
                 <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors">
                   Autres Formations
                 </h3>
               </div>

               <div className="p-6 flex flex-col flex-1 relative z-10 border-t border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                 <div className="absolute -top-6 right-6 w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                    <span className="font-bold text-xl group-hover:translate-x-1 transition-transform">→</span>
                 </div>

                 <div className="flex flex-col gap-3 mt-2">
                    <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 text-lg">📚</div>
                      <span><strong>{otherCourses.length}</strong> formation(s) libre(s)</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-sm font-medium">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 text-lg">💡</div>
                      <span>Sujets divers et variés</span>
                    </div>
                 </div>
               </div>
             </div>
          )}
        </div>

      ) : (
        
        // --- VUE 2 : LES COURS D'UNE BRANCHE ---
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
          {(() => {
            const coursesToShow = selectedCategoryId === 'OTHER' 
              ? courses.filter(c => !c.categoryId) 
              : courses.filter(c => c.categoryId === selectedCategoryId);

            if (coursesToShow.length === 0) return <p className="col-span-3 text-center py-20 text-slate-500 italic">Aucune formation dans cette branche.</p>;

            return coursesToShow.map(course => (
              <div key={course.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col overflow-hidden group">
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <img src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="course" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-black mb-2 line-clamp-1 text-slate-900">{course.title}</h3>
                  <p className="text-slate-500 text-sm mb-6 line-clamp-2 flex-1">{course.description}</p>
                  <button onClick={() => setSelectedCourse(course)} className="w-full py-3 bg-blue-600 text-white text-sm font-black rounded-xl hover:bg-blue-700 transition-all">
                    Débloquer 🔓
                  </button>
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* --- LA MODALE (FENÊTRE) DE LA CLÉ SECRÈTE --- */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">
              🔑
            </div>
            <h3 className="text-2xl font-black mb-2 text-slate-900">Clé d'accès requise</h3>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Entrez le code secret fourni par votre instructeur pour débloquer <strong className="text-slate-800">{selectedCourse.title}</strong>.
            </p>

            {unlockError && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl font-bold border border-red-100 flex items-center gap-2">
                <span>⚠️</span> {unlockError}
              </div>
            )}

            <form onSubmit={handleUnlock}>
              <input 
                type="text" 
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                placeholder="Ex: REACT2026"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-600 outline-none mb-6 font-mono text-lg uppercase font-bold text-center tracking-widest transition-colors"
                required
              />
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => { setSelectedCourse(null); setUnlockError(''); setAccessKey(''); }}
                  className="w-1/3 py-3 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isUnlocking}
                  className="w-2/3 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-70 flex justify-center items-center shadow-lg"
                >
                  {isUnlocking ? "Vérification..." : "Débloquer le cours"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}