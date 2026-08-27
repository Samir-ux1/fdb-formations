import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RedeemModal from '../components/RedeemModal';
import { 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  Clock, 
  Award,
  TrendingUp,
  Settings
} from 'lucide-react';

// --- COMPOSANT : COMPTEUR ANIMÉ ---
const AnimatedCounter = ({ end, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 2000;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = progress * (2 - progress); 
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    window.requestAnimationFrame(step);
  }, [end]);

  return (
    <span>
      {prefix}{count}{suffix}
    </span>
  );
};


// --- PAGE D'ACCUEIL PRINCIPALE ---
export default function Home() {
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 1. Récupérer l'utilisateur connecté
    try {
      const userData = localStorage.getItem('user');
      if (userData && userData !== "undefined") {
        setUser(JSON.parse(userData));
      }
    } catch (e) {
      console.error("Erreur de lecture du user", e);
    }

    // 2. Récupérer les formations depuis le Backend
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/courses');
        setFeaturedCourses(response.data.slice(0, 3)); 
      } catch (error) {
        console.error("Erreur de chargement des cours", error);
      }
    };
    fetchCourses();
  }, []);

  const unlockedCount = 0; // À lier plus tard avec les inscriptions réelles de l'utilisateur

  return (
    <div className="w-full bg-slate-50 min-h-screen font-sans text-slate-900 animate-in fade-in duration-300 pb-20">
      
      {/* 1. HERO SECTION (Toyota Material Handling Brand Style) */}
      <section className="p-4 md:p-8 max-w-7xl mx-auto pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Hero Card (8 cols) */}
          <div className="lg:col-span-8 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="relative z-10">
              <div className="inline-block px-3 py-1 bg-red-50 text-[#EB0A1E] font-black text-[10px] rounded-full uppercase tracking-wider mb-4 border border-red-100">
                Toyota Material Handling Academy
              </div>

              <h1 className="text-3xl sm:text-5xl font-black leading-tight text-slate-900 mb-4 tracking-tight">
                Formation Technique & <br />
                <span className="text-[#EB0A1E]">
                  Expertise en Manutention
                </span>
              </h1>

              <p className="text-slate-500 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
                Développez vos compétences en manutention, sécurité, maintenance et technologies Toyota pour une exploitation plus performante des équipements.
              </p>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  className="px-6 py-3.5 bg-[#EB0A1E] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-[#BD0014] transition-all flex items-center gap-2 active:scale-95"
                >
                  <span>{user ? "Reprendre la formation" : "Se Connecter"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {user?.role === 'INSTRUCTOR' && (
                  <button
                    onClick={() => navigate('/instructor')}
                    className="px-5 py-3.5 bg-[#111827] text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm active:scale-95"
                  >
                    <Settings className="w-4 h-4 text-[#EB0A1E]" />
                    <span>Portail Formateur</span>
                  </button>
                )}
              </div>

              <div className="pt-6 mt-8 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500 font-semibold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Cours pratiques et théoriques</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#EB0A1E]" />
                  <span>Évaluation des Compétences</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Highlights (4 cols) */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            
            {/* Metric 1: Formations & Accréditations */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#EB0A1E] flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Certifié Toyota
                </span>
              </div>
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-1">
                  <AnimatedCounter end={98} suffix="%" />
                </h3>
                <p className="text-xs font-bold text-slate-700">Taux de réussite aux examens</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Sur 1 400+ techniciens formés</p>
              </div>
            </div>

            {/* Metric 2: Active User Progress Card */}
            <div className="bg-[#111827] text-white p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#EB0A1E] text-white flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                {user && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                    N° {user.id || '0000'}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-white">{user ? user.name : "Visiteur"}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {user ? `${unlockedCount} formation(s) en cours` : "Connectez-vous pour suivre votre progression."}
                </p>
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  className="mt-4 text-xs font-black text-[#EB0A1E] hover:text-white transition-colors flex items-center gap-1 uppercase tracking-wider"
                >
                  <span>{user ? "Mon Tableau de bord" : "Créer un compte"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. THREE FEATURE HIGHLIGHTS */}
      <section className="px-4 md:px-8 max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-red-200 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#EB0A1E] flex items-center justify-center mb-4 font-black">
              SAS
            </div>
            <h3 className="font-black text-base text-slate-900 mb-2">Système Actif de Stabilité</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Découvrez le fonctionnement du système Toyota SAS et comprenez comment il contribue à améliorer la stabilité du chariot et la sécurité de l'opérateur.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-red-200 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-[#EB0A1E]" />
            </div>
            <h3 className="font-black text-base text-slate-900 mb-2">Conduite & Réglementation</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Familiarisez-vous avec les règles de sécurité, les bonnes pratiques de conduite et les exigences applicables à l'utilisation des équipements de manutention.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-red-200 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#EB0A1E] flex items-center justify-center mb-4 font-black">
              TPS
            </div>
            <h3 className="font-black text-base text-slate-900 mb-2">Toyota Production System</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Découvrez les principes du Lean, du 5S, du Kaizen et de la réduction des gaspillages pour améliorer l'efficacité des opérations.
            </p>
          </div>
        </div>
      </section>

      {/* 3. FEATURED COURSES GRID */}
      <section className="p-4 md:px-8 max-w-7xl mx-auto py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#EB0A1E]">
              Catalogue Sélectionné
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Formations Recommandées</h2>
          </div>
          <Link
            to="/catalog"
            className="text-xs font-black uppercase tracking-wider text-[#EB0A1E] hover:underline flex items-center gap-1"
          >
            <span>Voir tout le catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredCourses.length > 0 ? featuredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-red-200 hover:shadow-md transition-all group"
            >
              <div className="h-48 relative bg-slate-100 overflow-hidden">
                <img
                  src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <span className="px-2.5 py-1 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-black rounded-full flex items-center gap-1 shadow-sm">
                    <Lock className="w-3 h-3 text-[#EB0A1E]" />
                    Clé requise
                  </span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-[#EB0A1E] transition-colors leading-snug mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                    {course.description || "Découvrez cette formation conçue par nos experts Toyota pour maximiser vos compétences."}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>À votre rythme</span>
                  </div>

                  <button
                    onClick={() => navigate('/catalog')}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-[#EB0A1E] text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Découvrir</span>
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-3 text-center py-10 text-slate-500">
              Chargement des formations recommandées...
            </div>
          )}
        </div>
      </section>

      {/* 4. REDEMPTION BANNER */}
      <section className="p-4 md:px-8 max-w-7xl mx-auto py-8">
        <div className="bg-[#111827] text-white rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden space-y-4 shadow-xl">
          {/* Design elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-[#EB0A1E] text-white flex items-center justify-center mx-auto shadow-md mb-6">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-3">Vous disposez d'un code ?</h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed mb-8">
              Entrez votre clé pour débloquer une formation et accéder immédiatement à son contenu pédagogique.
            </p>
            <button
              onClick={() => navigate('?modal=redeem')}
              className="px-8 py-4 bg-[#EB0A1E] hover:bg-[#BD0014] text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-900/50 transition-all active:scale-95 hover:-translate-y-1"
            >
              Accéder à l'activation par clé
            </button>
          </div>
        </div>
      </section>

      

    </div>
  );
}