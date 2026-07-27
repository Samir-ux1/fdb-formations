import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);
  const [otherCourses, setOtherCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      navigate('/login');
      return;
    } 
    setUser(JSON.parse(userData));

    const fetchMyCourses = async () => {
      try {
        const response = await axios.get('https://fdb-formations-production.up.railway.app/api/courses/my-courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // 1. On calcule la progression de chaque cours
        const coursesWithProgress = response.data.map(course => {
          const totalLessons = course.lessons?.length || 0;
          const completedLessons = course.lessons?.filter(l => l.progresses?.length > 0).length || 0;
          const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
          
          return { ...course, totalLessons, completedLessons, progress };
        });

        if (coursesWithProgress.length > 0) {
          // 2. On trouve le cours "En cours" (celui qui a + de 0% mais moins de 100%)
          // S'il n'y en a pas, on prend le premier de la liste
          const current = coursesWithProgress.find(c => c.progress > 0 && c.progress < 100) || coursesWithProgress[0];
          setActiveCourse(current);
          
          // 3. On met les autres cours dans la liste en bas
          setOtherCourses(coursesWithProgress.filter(c => c.id !== current.id));
        }

      } catch (error) {
        console.error("Erreur", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMyCourses();
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans text-slate-800">
        
      {/* EN-TÊTE SANS BOUTON DÉCONNEXION */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Tableau de Bord</h1>
          <p className="text-slate-500 mt-2 text-lg">Heureux de vous revoir, <span className="font-bold text-blue-600">{user.name}</span> !</p>
        </div>
        
        {user.role === 'INSTRUCTOR' && (
          <button 
            onClick={() => navigate('/instructor')}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            ⚙️ Portail Instructeur
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-slate-500 text-center mt-20 font-bold">Chargement de votre espace...</p>
      ) : !activeCourse ? (
        
        // SI AUCUN COURS DÉBLOQUÉ
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mb-6">📚</div>
          <h2 className="text-2xl font-bold mb-2">Prêt à apprendre ?</h2>
          <p className="text-slate-500 mb-8 max-w-md">Vous n'avez pas encore de formation. Découvrez notre catalogue et utilisez votre clé d'accès pour commencer.</p>
          <button onClick={() => navigate('/catalog')} className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all">
            Explorer le catalogue
          </button>
        </div>

      ) : (
        <>
          {/* SECTION : REPRENDRE LA LECTURE (Avec Cercle de Progression) */}
          <h2 className="text-xl font-bold mb-6">Reprendre la lecture</h2>
          
          <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-200 flex flex-col md:flex-row items-center gap-8 p-6 md:p-8 mb-12">
            
            <div className="w-full md:w-1/3 h-56 rounded-2xl overflow-hidden bg-slate-100 shrink-0 relative group">
              <img src={activeCourse.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"} alt="course" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
              <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors"></div>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                En cours
              </div>
              <h2 className="text-3xl font-bold text-slate-900 leading-tight">{activeCourse.title}</h2>
              <p className="text-slate-500 line-clamp-2">{activeCourse.description}</p>
              
              <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                
                {/* LE CERCLE DE PROGRESSION SVG */}
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
                    <circle 
                      cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" 
                      strokeDasharray="176" 
                      strokeDashoffset={176 - (176 * activeCourse.progress) / 100} 
                      className="text-blue-600 transition-all duration-1000 ease-out" 
                    />
                  </svg>
                  <span className="absolute text-sm font-bold text-slate-700">{activeCourse.progress}%</span>
                </div>
                
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">
                    {activeCourse.completedLessons} / {activeCourse.totalLessons} leçons terminées
                  </p>
                  <button 
                    onClick={() => navigate(`/courses/${activeCourse.id}`)} 
                    className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <span>▶</span> Continuer le cours
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* LISTE DES AUTRES FORMATIONS */}
          {otherCourses.length > 0 && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Mes autres formations</h2>
                <button onClick={() => navigate('/catalog')} className="text-blue-600 font-bold text-sm hover:underline">
                  Voir le catalogue
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherCourses.map(course => (
                  <div key={course.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col overflow-hidden group cursor-pointer" onClick={() => navigate(`/courses/${course.id}`)}>
                    <div className="h-40 relative overflow-hidden bg-slate-100">
                      <img src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      
                      {/* Petite bulle de progression sur l'image */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm">
                        {course.progress}%
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="text-lg font-bold mb-2 line-clamp-1 text-slate-900">{course.title}</h3>
                      <p className="text-slate-500 text-sm mb-6 line-clamp-2 flex-1">{course.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

    </div>
  );
}