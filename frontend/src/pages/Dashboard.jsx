import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  GraduationCap, 
  Award, 
  Clock, 
  CheckCircle2, 
  Play, 
  KeyRound, 
  ArrowRight,
  Download,
  Settings
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [otherCourses, setOtherCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // États spécifiques pour la carte de déblocage rapide de clés
  const [quickKey, setQuickKey] = useState('');
  const [keyMessage, setKeyMessage] = useState(null);
  const [learningTime, setLearningTime] = useState("0m");

  // Fonction magique pour récupérer le temps d'un module précis
  const getCourseLearningTime = (userId, courseId) => {
    const storageKey = `time_user_${userId}_course_${courseId}`;
    const totalSeconds = parseInt(localStorage.getItem(storageKey) || '0', 10);
    
    if (totalSeconds === 0) return "0m";
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    // On parse l'utilisateur une seule fois
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // ==========================================
    // NOUVEAU : CALCUL DU TEMPS D'APPRENTISSAGE
    // ==========================================
    let totalSeconds = 0;
    // On parcourt la mémoire du navigateur pour cet utilisateur
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`time_user_${parsedUser.id}_course_`)) {
        totalSeconds += parseInt(localStorage.getItem(key) || '0', 10);
      }
    }
    // On convertit les secondes en Heures / Minutes
    if (totalSeconds === 0) {
      setLearningTime("0m");
    } else {
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      if (hours > 0) {
        setLearningTime(`${hours}h ${minutes}m`);
      } else {
        setLearningTime(`${minutes}m`);
      }
    }
    // ==========================================

    const fetchMyCourses = async () => {
      try {
        const response = await axios.get('https://fdb-formations.vercel.app/api/courses/my-courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // 1. On calcule la progression de chaque cours
        const coursesWithProgress = response.data.map(course => {
          const totalLessons = course.lessons?.length || 0;
          const completedLessons = course.lessons?.filter(l => l.progresses?.length > 0).length || 0;
          const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
          
          return { 
            ...course, 
            totalLessons, 
            completedLessons, 
            progress,
            isUnlocked: true // Tous les cours renvoyés par my-courses sont considérés comme débloqués
          };
        });

        setCourses(coursesWithProgress);

        if (coursesWithProgress.length > 0) {
          // 2. On trouve le cours "En cours" (celui qui a + de 0% mais moins de 100%)
          const current = coursesWithProgress.find(c => c.progress > 0 && c.progress < 100) || coursesWithProgress[0];
          setActiveCourse(current);
          
          // 3. On met les autres cours dans la liste en bas
          setOtherCourses(coursesWithProgress.filter(c => c.id !== current.id));
        }

      } catch (error) {
        console.error("Erreur lors du chargement des cours", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMyCourses();
  }, [navigate]);

  // Fonction de simulation de déblocage par clé rapide
  const handleQuickUnlock = async (e) => {
    e.preventDefault();
    if (!quickKey.trim()) return;

    const token = localStorage.getItem('token');
    try {
      // Appel API fictif ou réel pour valider la clé d'accès (adaptable selon votre route backend)
      await axios.post('https://fdb-formations.vercel.app/api/courses/unlock', { key: quickKey.trim() }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setKeyMessage({ type: 'success', text: `Succès ! Formation débloquée pour la clé ${quickKey.toUpperCase()}` });
      setQuickKey('');
      
      // Recharger les cours après déblocage
      window.location.reload();
    } catch (error) {
      console.error(error);
      setKeyMessage({ type: 'error', text: `Clé non reconnue ou déjà utilisée.` });
    }
  };

  const handleDownloadCertificate = (courseTitle) => {
    alert(`Attestation Officielle Toyota Material Handling générée avec succès pour :\n"${courseTitle}"\n\nTitulaire : ${user?.name}\nDate de validation : ${new Date().toLocaleDateString('fr-FR')}`);
  };

  if (!user || isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto text-center mt-20">
        <p className="text-slate-500 font-bold text-lg">Chargement de votre espace...</p>
      </div>
    );
  }

  const completedCourses = courses.filter(c => c.progress === 100);
  const totalProgressAverage = courses.length > 0
    ? Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length)
    : 0;

  // 2. On calcule le niveau technique dynamiquement
  const technicalLevel = completedCourses.length === 0 ? "Débutant" 
                       : completedCourses.length <= 3 ? "Initié" 
                       : completedCourses.length <= 6 ? "Confirmé"
                       : "Expert";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans text-slate-800 space-y-8 animate-in fade-in duration-300">
      
      {/* Toyota Top Header Profile Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
  
  {/* Partie Gauche : Avatar + Infos Utilisateur */}
  <div className="flex items-center gap-6 relative z-10 min-w-0">
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EB0A1E] text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-md overflow-hidden shrink-0">
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
      ) : (
        user.name ? user.name.charAt(0).toUpperCase() : 'U'
      )}
    </div>
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="px-3 py-0.5 bg-red-50 text-[#EB0A1E] text-[10px] font-black uppercase tracking-wider rounded-full border border-red-100">
          {user.role === 'INSTRUCTOR' ? 'Formateur Instructeur' : 'Apprenant'}
        </span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 truncate">{user.name}</h1>
      <p className="text-xs sm:text-sm text-slate-500 truncate">{user.email}</p>
    </div>
  </div>

  {/* Partie Droite : Bouton Portail Instructeur + Jauge de Progression (Poussée à droite) */}
  <div className="flex flex-wrap items-center justify-end gap-4 relative z-10 w-full md:w-auto ml-auto">
    {user.role === 'INSTRUCTOR' && (
      <button
        onClick={() => navigate('/instructor')}
        className="px-4 py-3 bg-[#111827] hover:bg-[#EB0A1E] text-white text-xs font-bold rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
      >
        <Settings className="w-4 h-4 text-[#EB0A1E]" />
        <span>Portail Instructeur</span>
      </button>
    )}

    {/* Jauge de Progression Circulaire (SVG) */}
    <div className="bg-slate-50 p-3.5 sm:p-3 rounded-2xl border border-slate-200 flex items-center gap-2">
      <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
        <svg className="w-14 h-14 transform -rotate-90">
          <circle
            cx="28"
            cy="28"
            r="22"
            stroke="currentColor"
            strokeWidth="5"
            className="text-slate-200"
            fill="transparent"
          />
          <circle
            cx="28"
            cy="28"
            r="22"
            stroke="currentColor"
            strokeWidth="5"
            className="text-[#EB0A1E]"
            strokeDasharray={138}
            strokeDashoffset={138 - (138 * totalProgressAverage) / 100}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="absolute text-xs font-black text-slate-900">{totalProgressAverage}%</span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-900">Progression globale</p>
        <p className="text-[11px] text-slate-500">{courses.length} formation(s) active(s)</p>
      </div>
    </div>
  </div>
</div>

      {/* 4 Statistics Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* CARTE 1 : Cours Débloqués */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#EB0A1E] flex items-center justify-center mb-3">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{courses.length}</span>
          <span className="text-xs font-semibold text-slate-400">Cours Débloqués</span>
        </div>

        {/* CARTE 2 : Formations Validées */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{completedCourses.length}</span>
          <span className="text-xs font-semibold text-slate-400">Formations Validées</span>
        </div>

        {/* CARTE 3 : Temps Apprentissage (Dynamique !) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{learningTime}</span>
          <span className="text-xs font-semibold text-slate-400">Temps Apprentissage</span>
        </div>

        {/* CARTE 4 : Niveau Technique (Dynamique !) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-xl font-black text-slate-900 block">{technicalLevel}</span>
          <span className="text-xs font-semibold text-slate-400">Niveau technique</span>
        </div>

      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Formations en cours & Certificats */}
        <div className="lg:col-span-2 space-y-6">
          
          {!activeCourse ? (
            <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mb-6">📚</div>
              <h2 className="text-2xl font-bold mb-2">Prêt à apprendre ?</h2>
              <p className="text-slate-500 mb-8 max-w-md">Vous n'avez pas encore de formation. Découvrez notre catalogue et utilisez votre clé d'accès pour commencer.</p>
              <button onClick={() => navigate('/catalog')} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all cursor-pointer">
                Explorer le catalogue
              </button>
            </div>
          ) : (
            <>
              {/* Hero "Continue Course" Card */}
              <div className="bg-[#111827] text-white rounded-3xl p-6 md:p-8 shadow-md border border-slate-800 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2 relative z-10 max-w-md">
                  <span className="px-3 py-1 bg-[#EB0A1E] text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                    Reprendre la formation
                  </span><br /><br />
                  <h3 className="text-xl sm:text-2xl font-black text-white">{activeCourse.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{activeCourse.description}</p>
                  <div className="flex items-center gap-3 pt-1 text-xs text-slate-300 font-semibold">
                    <span>Progression : {activeCourse.progress || 0}%</span>
                    <span>•</span>
                    <span>{activeCourse.totalLessons} leçons ({activeCourse.completedLessons} terminées)</span>
                  </div>
                </div> 

                <button
                  onClick={() => navigate(`/courses/${activeCourse.id}`)}
                  className="px-6 py-3.5 bg-[#EB0A1E] hover:bg-[#BD0014] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Continuer le cours</span>
                </button>
              </div>

              {/* Ongoing Courses List */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Mes Formations Débloquées</h2>
                    <p className="text-xs text-slate-500">Accédez directement à vos supports vidéos et examens</p>
                  </div>
                  <button
                    onClick={() => navigate('/catalog')}
                    className="text-xs font-bold text-[#EB0A1E] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Catalogue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-red-200 bg-white hover:bg-slate-50 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                    >
                      <div className="flex items-center gap-6 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          <img src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"} alt={course.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#EB0A1E]">
                            Formation Active
                          </span>
                          <h4 className="font-bold text-sm text-slate-900 truncate">{course.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                            <span className="font-bold text-slate-700">{course.progress || 0}% validé</span>
                            <span>•</span>
                            <span>{course.totalLessons} leçons</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="px-4 py-2.5 bg-[#111827] hover:bg-[#EB0A1E] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>{course.progress === 100 ? "Revoir" : "Accéder"}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Certificats & Attestations */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Attestations & Certificats</h2>
            <p className="text-xs text-slate-500 mb-5">Délivrés automatiquement après validation de la formation à 100%</p>

            <div className="space-y-3">
              {completedCourses.length > 0 ? (
                completedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-emerald-950">{course.title}</h4>
                        <p className="text-[11px] text-emerald-700 font-medium">Certification officielle validée</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadCertificate(course.title)}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Attestation</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500 flex items-center gap-3">
                  <Award className="w-5 h-5 text-slate-400 shrink-0" />
                  <span>Complétez l'intégralité d'une formation et son examen pour débloquer votre première attestation officielle.</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Col: Quick Unlock Card & Manager Contact */}
        <div className="space-y-6">
          
          {/* Quick Key Redemption Card */}
          <div className="bg-[#111827] text-white rounded-3xl p-6 shadow-md border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-[#EB0A1E] flex items-center justify-center text-white mb-4 shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="font-black text-lg mb-1">Activer un cours</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Saisissez le code secret transmis par votre superviseur ou formateur.
            </p>

            {keyMessage && (
              <div className={`mb-4 p-3 rounded-xl text-xs font-bold border ${
                keyMessage.type === 'success' ? 'bg-emerald-950 border-emerald-500 text-emerald-200' : 'bg-red-950 border-red-500 text-red-200'
              }`}>
                {keyMessage.text}
              </div>
            )}

            <form onSubmit={handleQuickUnlock} className="space-y-3">
              <input
                type="text"
                value={quickKey}
                onChange={(e) => {
                  setQuickKey(e.target.value.toUpperCase());
                  setKeyMessage(null);
                }}
                placeholder="EX: SAFETY24, TOY-2024-X"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold tracking-widest text-center text-white focus:outline-none focus:border-[#EB0A1E] uppercase"
              />
              <button
                type="submit"
                disabled={!quickKey.trim()}
                className="w-full py-2.5 bg-[#EB0A1E] hover:bg-[#BD0014] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shadow-md cursor-pointer"
              >
                Débloquer la formation
              </button>
            </form>
          </div>

          {/* Support / Technical Assistance */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs text-xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Support Formation</h4>
            <p className="text-slate-500 leading-relaxed">
              Besoin d'un accès particulier ou d'une validation technique d'habilitation ? Contactez le pôle formation.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 font-semibold space-y-1">
              <p className="text-[11px] font-bold text-[#EB0A1E]">Support Technique :</p>
              <p className="text-xs font-mono">formation@plateforme-apprentissage.fr</p>
              <p className="text-[11px] text-slate-400">Disponibilité : Lundi - Vendredi 8h-18h</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}