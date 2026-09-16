import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import RedeemModal from '../components/RedeemModal';
// Si la page est blanche, c'est probablement cette ligne qui pose problème !
import { 
  Menu, 
  KeyRound, 
  GraduationCap, 
  Layers, 
  Home as HomeIcon,
  ChevronDown,
  Settings,
  PlaySquare,
  LogOut,
  UserRound
} from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const lastCourseId = typeof window !== 'undefined' ? localStorage.getItem('lastCourseId') : null;

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      // On vérifie que la donnée existe et n'est pas le mot "undefined" en texte
      if (userData && userData !== "undefined" && userData !== "null") {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Erreur critique lors du chargement de l'utilisateur :", error);
      localStorage.removeItem('user'); // On nettoie si le cache est corrompu
      setUser(null);
    }
  }, [location.pathname]); // On n'écoute que le changement de chemin

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastCourseId');
    setUser(null);
    setProfileOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Variables 100% sécurisées basées sur votre base Prisma
  const userName = user?.name || 'Utilisateur';
  const userInitial = userName.charAt(0).toUpperCase();
  const userRole = user?.role || 'STUDENT';
  const userEmail = user?.email || '';
  const avatarUrl = user?.avatarUrl || null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 left-0 w-full z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex justify-between items-center">
          
          {/* GAUCHE : Logo */}
          <div className="flex items-center gap-3">

            <Link to="/" className="flex items-center gap-3 cursor-pointer group">
              <div className="w-8 h-8 rounded-lg bg-[#EB0A1E] flex items-center justify-center text-white shadow-sm group-hover:bg-[#BD0014] transition-colors">
                <span className="font-black text-sm tracking-tighter">FDB</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base tracking-tight text-slate-900 leading-tight">
                FORMATIONS <span className="text-[#EB0A1E] text-xs font-bold uppercase"> Hub</span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                  TOYOTA Material Handling
                </span>
              </div>
            </Link>
          </div>

          {/* CENTRE : Liens (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Link to="/catalog" className={`transition-colors flex items-center gap-1.5 ${isActive('/catalog') ? 'text-[#EB0A1E] font-black' : 'hover:text-slate-900'}`}>
              <Layers className="w-4 h-4" />
              <span>Catalogue</span>
            </Link>

            <Link to={lastCourseId ? `/courses/${lastCourseId}` : "/catalog"} className={`transition-colors flex items-center gap-1.5 ${location.pathname.includes('/courses/') ? 'text-[#EB0A1E] font-black' : 'hover:text-slate-900'}`}>
              <PlaySquare className="w-4 h-4" /> 
              <span>Ma Formation</span>
            </Link>

            {user && (
              <Link to="/dashboard" className={`transition-colors flex items-center gap-1.5 ${isActive('/dashboard') ? 'text-[#EB0A1E] font-black' : 'hover:text-slate-900'}`}>
                <GraduationCap className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            )}

            {userRole === 'INSTRUCTOR' && (
              <Link to="/instructor" className={`transition-colors flex items-center gap-1.5 px-3 py-1 rounded-lg ${isActive('/instructor') ? 'bg-[#111827] text-white' : 'bg-red-50 text-[#EB0A1E] hover:bg-red-100'}`}>
                <Settings className="w-3.5 h-3.5" />
                <span>Portail Formateur</span>
              </Link>
            )}
          </nav>

          {/* DROITE : Profil & Connexion */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="?modal=redeem" className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-[#EB0A1E] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{lastCourseId ? "Reprendre" : "Parcourir"}</span>
                </Link>

                {/* Bouton Profil */}
                <div className="relative">
                  <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-slate-100 transition-colors active:scale-95 cursor-pointer border-none outline-none">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-slate-900 leading-none">{userName}</p>
                      <p className="text-[10px] text-[#EB0A1E] font-bold uppercase">
                        {userRole === 'INSTRUCTOR' ? 'Formateur' : 'Étudiant'}
                      </p>
                    </div>
                    
                    {/* Avatar basé sur Prisma (avatarUrl) */}
                    <div className="w-9 h-9 rounded-xl bg-[#EB0A1E] text-white shadow-sm flex items-center justify-center overflow-hidden font-bold text-xs">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{userInitial}</span>
                      )}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
                  </button>

                  {/* Menu Déroulant du Profil */}
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-40">
                        <div className="p-3 bg-slate-50 rounded-xl mb-2 border border-slate-100">
                          <p className="font-bold text-xs text-slate-900">{userName}</p>
                          <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                          <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-600">
                            <span className="px-2 py-0.5 bg-red-50 text-[#EB0A1E] rounded-md uppercase">
                              {userRole}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                            <span className="flex items-center gap-2"><GraduationCap  className="w-4 h-4 text-[#EB0A1E]" />Mon Tableau de bord</span>
                          </Link>

                          <Link to="/account" onClick={() => setProfileOpen(false)} className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                            <span className="flex items-center gap-2"><UserRound className="w-4 h-4 text-[#EB0A1E]" />Mon Compte</span>
                          </Link>

                          {userRole === 'INSTRUCTOR' && (
                            <Link to="/instructor" onClick={() => setProfileOpen(false)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#EB0A1E] hover:bg-red-50 rounded-lg transition-colors">
                              <Settings className="w-4 h-4" />Portail Instructeur
                            </Link>
                          )}

                          <div className="pt-2 mt-2 border-t border-slate-100">
                            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <LogOut className="w-4 h-4" />Déconnexion
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link to="/login" className="px-5 py-2 bg-[#EB0A1E] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-red-600/20 hover:bg-[#BD0014] transition-colors">
                Sign In
              </Link>
            )}
          </div>
        </div>
        
      </header>

      {/* CONTENU DE LA PAGE */}
      <div className="relative">
        <Outlet />
      </div>

      {/* ========================================= */}
      {/* FOOTER OFFICIEL TOYOTA MATERIAL HANDLING */}
      {/* ========================================= */}
      <footer className="bg-white border-t border-slate-200 py-10 mt-auto shrink-0">
        <div className="max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
          
          {/* 1. Logo & Copyright */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-6 h-6 bg-[#E3000F] text-white flex items-center justify-center rounded-sm font-black text-sm">
              T
            </div>
            <span className="font-bold text-slate-900 text-sm">
              © 2026 Toyota Material Handling. Tous droits réservés.
            </span>
          </div>

          {/* 2. Liens Horizontaux */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[13px] text-slate-600 font-medium mb-8">
            <a href="#" className="hover:text-[#E3000F] transition-colors">Mentions légales</a>
            <a href="#" className="hover:text-[#E3000F] transition-colors">Confidentialité & RGPD</a>
            <a href="#" className="hover:text-[#E3000F] transition-colors">Support technique usine</a>
            <a href="#" className="hover:text-[#E3000F] transition-colors">Accréditation SAS & CACES</a>
          </div>

          {/* 3. Texte Disclaimer */}
          <div className="text-slate-400 text-[11px] leading-relaxed">
            <p>Plateforme e-learning Toyota certifiée conforme aux référentiels logistiques industriels et aux protocoles de sécurité</p>
            <p>Toyota System of Active Stability (SAS).</p>
          </div>

        </div>
      </footer>

      
  
      {/* NOUVEAU : AFFICHE LA MODALE SI L'URL CONTIENT ?modal=redeem */}
      {location.search.includes('modal=redeem') && <RedeemModal />}

    {/* ... (Ton footer Toyota est ici) ... */}

      {/* NOUVEAU : LE SYSTÈME DE NOTIFICATIONS GLOBAL */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#111827', // Fond noir Toyota
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '4px', // Coins carrés
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#E3000F', secondary: '#fff' }, // Rouge Toyota
          },
        }}
      />
    </div> // <-- La toute dernière balise div fermante du Layout
  );
}