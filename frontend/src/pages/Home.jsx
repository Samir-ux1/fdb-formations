import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// --- COMPOSANT : COMPTEUR ANIMÉ ---
const AnimatedCounter = ({ end, prefix = "", suffix = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const duration = 2000; // L'animation dure 2 secondes

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Courbe d'accélération pour un effet plus naturel (ease-out)
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
    <span className="text-4xl md:text-5xl font-black text-slate-900 block mb-2">
      {prefix}{count}{suffix}
    </span>
  );
};


// --- PAGE D'ACCUEIL PRINCIPALE ---
export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));

    const fetchCourses = async () => {
      try {
        const response = await axios.get('https://fdb-formations-production.up.railway.app/api/courses');
        setFeaturedCourses(response.data.slice(0, 3)); 
      } catch (error) {
        console.error("Erreur", error);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="w-full font-sans text-slate-800">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute top-0 left-0 -ml-20 mt-40 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>

        <div className="max-w-7xl mx-auto px-8 pt-24 pb-20 relative z-10 text-center md:text-left grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-full uppercase tracking-wider border border-blue-100">
              🚀 Nouvelle Plateforme E-Learning
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1]">
              Maîtrisez la tech, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">à votre rythme.</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-lg mx-auto md:mx-0">
              Accélérez votre carrière avec des formations intensives créées par des experts. Accès premium via clé secrète, lecteur vidéo intelligent et suivi de progression.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4 pt-4">
              <Link to={user ? "/catalog" : "/login"} className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 hover:-translate-y-1 transition-all">
                {user ? "Explorer le catalogue" : "Commencer gratuitement"}
              </Link>
              <Link to="/catalog" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                Voir les cours
              </Link>
            </div>
          </div>

          <div className="hidden md:block relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-[2.5rem] transform rotate-3 opacity-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop" 
              alt="Étudiants" 
              className="rounded-[2.5rem] shadow-2xl relative z-10 object-cover h-[500px] w-full"
            />
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl z-20 flex items-center gap-4 animate-bounce">
              <div className="w-12 h-12 bg-green-100 text-green-600 flex justify-center items-center rounded-full text-2xl">✓</div>
              <div>
                <p className="font-bold text-slate-900">Progression</p>
                <p className="text-xs text-slate-500">Sauvegardée auto.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NOUVELLE SECTION : STATISTIQUES ANIMÉES */}
      <section className="bg-slate-50 border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Nos Chiffres</h2>
            <p className="text-slate-500 mt-2">La communauté grandit chaque jour</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center divide-x divide-slate-200/60">
            
            <div className="flex flex-col items-center">
              <AnimatedCounter end={40} prefix="+" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Formations</p>
            </div>
            
            <div className="flex flex-col items-center">
              <AnimatedCounter end={500} prefix="+" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Étudiants</p>
            </div>
            
            <div className="flex flex-col items-center">
              <AnimatedCounter end={300} prefix="+" suffix=" h" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">De Vidéos</p>
            </div>
            
            <div className="flex flex-col items-center">
              <AnimatedCounter end={15} />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Instructeurs</p>
            </div>
            
            <div className="flex flex-col items-center col-span-2 md:col-span-1 border-l-0 md:border-l">
              <AnimatedCounter end={95} suffix="%" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Satisfaction</p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. FONCTIONNALITÉS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Une expérience d'apprentissage unique</h2>
            <p className="text-slate-500">Nous avons repensé la façon dont vous consommez le contenu technique pour maximiser votre rétention.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: '🎬', title: 'Lecteur Vidéo Intelligent', desc: 'Reprenez exactement là où vous vous étiez arrêté. Notre lecteur sauvegarde votre progression.' },
              { icon: '🔐', title: 'Accès par Clé Secrète', desc: 'Débloquez des formations exclusives fournies par votre entreprise ou votre école.' },
              { icon: '🏆', title: 'Progression Séquentielle', desc: 'Chaque chapitre débloque le suivant. Restez concentré et suivez le chemin pédagogique.' }
            ].map((feat, idx) => (
              <div key={idx} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-blue-200 transition-colors">
                <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center text-3xl mb-6">
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LES COURS EN VEDETTE */}
      <section className="bg-slate-900 py-24 text-white">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-bold mb-4">Formations à la une</h2>
              <p className="text-slate-400">Découvrez les cours les plus populaires ce mois-ci.</p>
            </div>
            <Link to="/catalog" className="hidden md:block text-blue-400 font-bold hover:text-blue-300">
              Voir tout le catalogue →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCourses.length > 0 ? featuredCourses.map((course) => (
              <div key={course.id} className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all group">
                <div className="h-48 relative overflow-hidden bg-slate-700">
                  <img src={course.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"} alt="course" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"/>
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2">{course.title}</h3>
                  <p className="text-slate-400 text-sm mb-6 line-clamp-2">{course.description}</p>
                  <Link to="/catalog" className="w-full block text-center py-3 bg-slate-700 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors">
                    Découvrir
                  </Link>
                </div>
              </div>
            )) : (
              <p className="text-slate-500">Chargement des cours...</p>
            )}
          </div>
        </div>
      </section>

      {/* 5. APPEL À L'ACTION FINAL */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-8 relative z-10 text-center">
          <h2 className="text-5xl font-black text-slate-900 mb-6">Prêt à passer au niveau supérieur ?</h2>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto">
            Rejoignez notre communauté aujourd'hui et commencez à apprendre avec des outils pensés pour votre réussite.
          </p>
          <Link to={user ? "/dashboard" : "/login"} className="inline-block px-10 py-5 bg-blue-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-600/30 hover:-translate-y-2 hover:bg-blue-700 transition-all">
            {user ? "Accéder à mon tableau de bord" : "Créer un compte gratuitement"}
          </Link>
        </div>
      </section>

    </div>
  );
}