import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation(); // Permet de savoir sur quelle page on est
  const [user, setUser] = useState(null);
  const lastCourseId = localStorage.getItem('lastCourseId');

  // On vérifie si l'utilisateur est connecté à chaque fois qu'il change de page
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      setUser(null);
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastCourseId');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* NAVBAR GLOBALE */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="flex items-center justify-between px-8 max-w-7xl mx-auto h-20">
          
          <div className="flex items-center gap-10">
            <Link to="/" className="text-2xl font-black text-blue-600 tracking-tight">FDB Formations</Link>
            <div className="hidden md:flex gap-8 font-medium text-sm text-slate-500 items-center">
              
              {/* Explore mène maintenant au Catalogue */}
              <Link to="/catalog" className="hover:text-blue-600 transition-colors">
                Explore
              </Link>
              
              {/* Courses mène au dernier cours, ou est grisé et incliquable */}
              {lastCourseId ? (
                <Link to={`/courses/${lastCourseId}`} className="hover:text-blue-600 transition-colors font-bold text-blue-600">
                  Courses
                </Link>
              ) : (
                <span 
                  className="text-slate-300 cursor-not-allowed" 
                  title="Vous n'avez pas encore commencé de formation"
                >
                  Courses
                </span>
              )}

              {user && <Link to="/dashboard" className="hover:text-blue-600 transition-colors">My Learning</Link>}
              {user?.role === 'INSTRUCTOR' && (
                <Link to="/instructor" className="hover:text-blue-600 transition-colors">Instructor Portal</Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-2 border border-slate-200">
              <span className="text-slate-400 mr-2">🔍</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm outline-none w-48" placeholder="Search courses..." type="text"/>
            </div>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900">{user.name}</p>
                  <button onClick={handleLogout} className="text-[10px] text-slate-500 hover:text-red-500 uppercase font-bold tracking-wider">
                    Déconnexion
                  </button>
                </div>
                <Link to="/account" title="Mon Compte" className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform">
                  {user.name.charAt(0).toUpperCase()}
                </Link>
              </div>
            ) : (
              <Link to="/login" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* L'ESPACE VIDE OÙ VONT S'AFFICHER TES PAGES */}
      <div className="pt-20"> {/* pt-20 évite que la navbar cache le contenu */}
        <Outlet />
      </div>

    </div>
  );
}