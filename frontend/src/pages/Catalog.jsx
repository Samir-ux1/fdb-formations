import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  Lock, 
  KeyRound, 
  ChevronRight, 
  AlertCircle, 
  Play,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function Catalog() {
  const navigate = useNavigate();
  const { token } = useAuthStore(); 
  
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]); 
  const [myUnlockedCourseIds, setMyUnlockedCourseIds] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  // FILTRES
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  // Modale Clé Secrète
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [accessKey, setAccessKey] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const activeToken = token || localStorage.getItem('token');
        
        const requests = [
          axios.get('https://fdb-formations.vercel.app/api/courses'),
          axios.get('https://fdb-formations.vercel.app/api/categories')
        ];

        if (activeToken) {
          requests.push(
            axios.get('https://fdb-formations.vercel.app/api/courses/my-courses', {
              headers: { Authorization: `Bearer ${activeToken}` }
            })
          );
        }

        const responses = await Promise.all(requests);
        
        setCourses(responses[0].data);
        setCategories(responses[1].data);

        if (responses[2]) {
          const myIds = responses[2].data.map(c => c.id);
          setMyUnlockedCourseIds(myIds);
        }

      } catch (error) {
        console.error("Erreur de chargement", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

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

      await axios.post(`https://fdb-formations.vercel.app/api/courses/${selectedCourse.id}/unlock`, { key: accessKey }, { 
        headers: { Authorization: `Bearer ${activeToken}` } 
      });

      setSelectedCourse(null);
      setAccessKey('');
      navigate('/dashboard'); 

    } catch (error) {
      setUnlockError(error.response?.data?.message || "Erreur lors du déblocage ou clé invalide.");
    } finally {
      setIsUnlocking(false);
    }
  };

  const otherCourses = courses.filter(c => !c.categoryId);

  // ==========================================
  // LOGIQUE DE FILTRAGE
  // ==========================================
  let filteredCourses = courses;

  // 1. Filtre par Catégorie (si on a cliqué sur une branche)
  if (selectedCategoryId === 'OTHER') {
    filteredCourses = filteredCourses.filter(c => !c.categoryId);
  } else if (selectedCategoryId !== null) {
    filteredCourses = filteredCourses.filter(c => c.categoryId === selectedCategoryId);
  }

  // 2. Filtre par recherche texte
  if (searchQuery.trim() !== '') {
    const lowerQuery = searchQuery.toLowerCase();
    filteredCourses = filteredCourses.filter(c => 
      c.title.toLowerCase().includes(lowerQuery) || 
      (c.description && c.description.toLowerCase().includes(lowerQuery))
    );
  }

  // 3. Filtre par Niveau
  if (selectedLevel !== 'all') {
    filteredCourses = filteredCourses.filter(c => (c.level || "Débutant") === selectedLevel);
  }

  // 4. Filtre par statut débloqué
  if (showUnlockedOnly) {
    filteredCourses = filteredCourses.filter(c => myUnlockedCourseIds.includes(c.id));
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* HEADER CATALOGUE */}
      <div 
        className="text-white pt-16 pb-24 px-4 md:px-8 relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(17, 24, 39, 0.9), rgba(17, 24, 39, 0.7)), url('https://toyotamaterialhandling-international.com/storage/78ED4D4EA67DC2C61D353E40B8F87EDEEBAC5DEB3783309EA5186F1F261C0A50/b7b505aa7dfa456e981d679b8cb103de/jpg/media/297c9821642443628abc82b2a51287a1/%20Banner_OptioL.jpg')`
        }}
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800/50 border border-slate-700 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-300 mb-4">
            <Layers className="w-3.5 h-3.5 text-[#EB0A1E]" />
            Centre de Formation Technique
          </div>
          
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
                {selectedCategoryId === null ? "Catalogue Général" : "Formations Disponibles"}
              </h1>
              <p className="text-slate-400 text-sm md:text-base max-w-xl">
                {selectedCategoryId === null 
                  ? "Sélectionnez une spécialité industrielle ou explorez toutes nos formations." 
                  : "Parcourez les résultats de cette spécialité et utilisez les filtres pour affiner."}
              </p>
            </div>
            
            {/* Bouton Retour : Visible uniquement si on est dans une catégorie spécifique */}
            {selectedCategoryId !== null && (
              <button 
                onClick={() => {
                  setSelectedCategoryId(null);
                  setSearchQuery('');
                  setSelectedLevel('all');
                  setShowUnlockedOnly(false);
                }} 
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors border border-slate-700 text-xs uppercase tracking-wider shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour aux filières</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-10 relative z-20 space-y-10">
        
        {isLoading ? (
          <div className="bg-white p-10 rounded-3xl shadow-sm text-center border border-slate-200">
            <div className="w-8 h-8 border-4 border-[#EB0A1E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-bold text-sm">Chargement du catalogue industriel...</p>
          </div>
        ) : (
          <>
            {/* ============================================================ */}
            {/* 1. BLOC DES BRANCHES (Caché si une branche est sélectionnée) */}
            {/* ============================================================ */}
            {selectedCategoryId === null && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categories.map(cat => {
                    const branchCourses = courses.filter(c => c.categoryId === cat.id);
                    const courseCount = branchCourses.length;
                    return (
                      <div 
                  key={cat.id} 
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-red-200 transition-all duration-300 cursor-pointer flex flex-col"
                >
                  <div className="h-48 relative overflow-hidden bg-slate-100 shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent z-10"></div>
                    <img 
                      src={cat.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      alt={cat.name} 
                    />
                    
                    <div className="absolute top-3 left-3 z-20">
                      <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md text-white text-[9px] uppercase tracking-widest font-black rounded-full border border-white/30">
                        Spécialité
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-5 right-5 z-20">
                      <h3 className="text-xl font-black text-white group-hover:text-red-300 transition-colors">
                        {cat.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1 bg-white relative">
                    <div className="absolute -top-6 right-5 w-12 h-12 bg-[#EB0A1E] text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:-translate-y-1 group-hover:bg-[#BD0014] transition-all duration-300 z-30">
                      <ChevronRight className="w-6 h-6" />
                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                      <div className="flex items-center gap-3 text-slate-600 text-xs font-semibold">
                        <div className="w-8 h-8 rounded-xl bg-red-50 text-[#EB0A1E] flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span><strong>{courseCount}</strong> modules certifiants</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-slate-600 text-xs font-semibold">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span>Aligné Standard TPS</span>
                      </div>
                    </div>
                  </div>
                </div>
                    );
                  })}

                  {/* CARTE SPÉCIALE "AUTRES FORMATIONS" */}
                  {otherCourses.length > 0 && (
               <div 
                 onClick={() => setSelectedCategoryId('OTHER')} 
                 className="group bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-500 transition-all duration-300 cursor-pointer flex flex-col"
               >
                 <div className="h-48 relative overflow-hidden bg-slate-800 shrink-0">
                   <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800')] bg-cover bg-center mix-blend-overlay group-hover:opacity-60 transition-opacity duration-500"></div>
                   
                   <div className="absolute top-3 left-3 z-20">
                      <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md text-white text-[9px] uppercase tracking-widest font-black rounded-full border border-white/20">
                        Transversal
                      </span>
                    </div>

                   <div className="absolute bottom-4 left-5 right-5 z-20">
                     <h3 className="text-xl font-black text-white group-hover:text-blue-300 transition-colors">
                       Modules Généraux
                     </h3>
                   </div>
                 </div>

                 <div className="p-5 flex flex-col flex-1 bg-slate-900 relative">
                   <div className="absolute -top-6 right-5 w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:-translate-y-1 transition-all duration-300 z-30">
                     <ChevronRight className="w-6 h-6" />
                   </div>

                   <div className="flex flex-col gap-3 mt-2">
                      <div className="flex items-center gap-3 text-slate-300 text-xs font-semibold">
                        <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span><strong>{otherCourses.length}</strong> modules libres</span>
                      </div>
                   </div>
                 </div>
               </div>
            )}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* 2. BLOC BARRE DE FILTRE + FORMATIONS (Toujours visible)      */}
            {/* ============================================================ */}
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Titre si on affiche tout */}
              {selectedCategoryId === null && (
                <div className="pt-6 border-t border-slate-200">
                  <h2 className="text-2xl font-black text-slate-900">Toutes les formations</h2>
                </div>
              )}

              {/* BARRE D'OUTILS : Recherche & Filtres */}
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une formation..."
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-[#EB0A1E] transition-all cursor-pointer"
                  >
                    <option value="all">Tous les niveaux</option>
                    <option value="Débutant">Niveau Débutant</option>
                    <option value="Intermédiaire">Niveau Intermédiaire</option>
                    <option value="Avancé">Niveau Expert</option>
                  </select>

                  <button
                    onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
                    className={`px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                      showUnlockedOnly
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Débloqués uniquement</span>
                  </button>
                </div>
              </div>

              {/* GRILLE DES COURS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length === 0 ? (
                  <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-200 text-center text-slate-500 font-bold flex flex-col items-center">
                    <Search className="w-10 h-10 text-slate-300 mb-3" />
                    Aucune formation ne correspond à vos critères de recherche.
                  </div>
                ) : (
                  filteredCourses.map((course) => {
                    const isUnlocked = myUnlockedCourseIds.includes(course.id);
                    const catName = categories.find(cat => cat.id === course.categoryId)?.name || "Général";
                    const courseLevel = course.level || "Débutant";

                    return (
                      <div key={course.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-red-200 hover:shadow-md transition-all group">
                        <div className="h-44 relative bg-slate-100 overflow-hidden">
                          <img src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm">{catName}</span>
                            <span className="px-3 py-1 bg-[#111827]/80 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm">{courseLevel}</span>
                          </div>
                          <div className="absolute top-3 right-3">
                            {isUnlocked ? (
                              <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 shadow-sm"><CheckCircle2 className="w-3 h-3" /> Débloqué</span>
                            ) : (
                              <span className="px-2.5 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 shadow-sm"><Lock className="w-3 h-3 text-[#EB0A1E]" /> Clé requise</span>
                            )}
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <h3 className="font-bold text-base text-slate-900 group-hover:text-[#EB0A1E] transition-colors leading-snug">{course.title}</h3>
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{course.description || "Formation technique standard."}</p>
                          </div>

                          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{course.timeLimitDays ? `${course.timeLimitDays} Jours max` : "À votre rythme"}</span>
                            </div>

                            {isUnlocked ? (
                              <button onClick={() => navigate(`/courses/${course.id}`)} className="px-4 py-2.5 bg-[#111827] hover:bg-[#EB0A1E] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md active:scale-95">
                                <Play className="w-3.5 h-3.5" /><span>Accéder</span>
                              </button>
                            ) : (
                              <button onClick={() => setSelectedCourse(course)} className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-[#EB0A1E] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5">
                                <KeyRound className="w-3.5 h-3.5" /><span>Débloquer</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- LA MODALE DE LA CLÉ SECRÈTE --- */}
      {selectedCourse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#EB0A1E] rounded-t-3xl"></div>
            <div className="w-14 h-14 bg-red-50 text-[#EB0A1E] rounded-2xl flex items-center justify-center mb-5 shadow-sm">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black mb-2 text-slate-900 tracking-tight">Activation Requise</h3>
            <p className="text-slate-500 text-xs mb-6 leading-relaxed">
              Veuillez saisir la clé d'activation fournie par votre formateur pour déverrouiller : <br/>
              <strong className="text-slate-800 text-sm">{selectedCourse.title}</strong>
            </p>

            {unlockError && (
              <div className="mb-5 p-3 bg-red-50 text-[#EB0A1E] text-xs rounded-xl font-bold border border-red-100 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{unlockError}</span>
              </div>
            )}

            <form onSubmit={handleUnlock}>
              <input type="text" value={accessKey} onChange={(e) => setAccessKey(e.target.value.toUpperCase())} placeholder="EX: TYT-2026-X" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[#EB0A1E] outline-none mb-6 font-mono text-lg uppercase font-black text-center tracking-widest transition-all" required />
              <div className="flex gap-3">
                <button type="button" onClick={() => { setSelectedCourse(null); setUnlockError(''); setAccessKey(''); }} className="w-1/3 py-3 bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit" disabled={isUnlocking} className="w-2/3 py-3 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#EB0A1E] transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-md">
                  {isUnlocking ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <KeyRound className="w-4 h-4" />}
                  <span>{isUnlocking ? "Vérification..." : "Débloquer"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}