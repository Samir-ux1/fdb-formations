import { useState } from 'react';
import axios from 'axios'; // Importation d'axios
import { useNavigate } from 'react-router-dom';


export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Nouveaux états pour gérer les erreurs et le chargement
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // On réinitialise l'erreur à chaque nouvelle tentative
    setIsLoading(true); // On active le mode chargement

    try {
      if (isLogin) {
        // --- 1. LOGIQUE DE CONNEXION ---
        const response = await axios.post('https://fdb-formations-production.up.railway.app/api/auth/login', {
          email,
          password
        });
        
        // Si succès : on sauvegarde le token et les infos de l'utilisateur
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        navigate('/'); // TODO: Bientôt, on redirigera l'utilisateur vers son Dashboard ici !
        // TODO: Bientôt, on redirigera l'utilisateur vers son Dashboard ici !

      } else {
        // --- 2. LOGIQUE D'INSCRIPTION ---
        await axios.post('https://fdb-formations-production.up.railway.app/api/auth/register', {
          name,
          email,
          password,
          role: 'STUDENT' // Par défaut on l'inscrit comme étudiant
        });
        
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        setIsLogin(true); // On le renvoie sur le formulaire de connexion
      }
    } catch (err) {
      // Si le backend renvoie une erreur (ex: mauvais mot de passe)
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false); // On désactive le chargement dans tous les cas
    }
  };

  return (
    <main className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-blue-600">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40" 
          style={{ backgroundImage: "url('https://toyotamaterialhandling-international.com/storage/CADA05EDC4097C0C622D13BB72D608DF246FE552BA02346ACAA4B5E756DE4ACA/518ff646ddeb41c282f49be249acd61b/png/media/39122e64c9fb4d69b14e2a5efa471e33/Service.png')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/80 to-transparent"></div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold tracking-tight">FDB Formations</span>
          </div>
          <div className="max-w-md mb-20">
            <h2 className="text-5xl font-bold mb-6 leading-tight">Maîtrisez vos compétences techniques.</h2>
            <p className="text-lg text-blue-100">Rejoigne notre platforme pour atteignent vos objectifs professionnels.</p>
          </div>
        </div>
      </section>
      
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md z-10">
          <div className="bg-white/70 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 transition-all duration-500">
            
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-slate-900 mb-2">
                {isLogin ? "Bon retour ! 👋" : "Créer un compte"}
              </h3>
              <p className="text-slate-500">
                {isLogin ? "Connectez-vous pour continuer votre apprentissage." : "Commencez votre aventure d'apprentissage aujourd'hui."}
              </p>
            </div>

            {/* Affichage des erreurs en rouge */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {!isLogin && (
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-2">Nom complet</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" 
                    placeholder="John Doe" 
                    required={!isLogin} 
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-2">Adresse Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" 
                  placeholder="nom@exemple.com" 
                  required 
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-600 block">Mot de passe</label>
                  {isLogin && <a href="#" className="text-sm text-blue-600 hover:underline">Oublié ?</a>}
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" 
                  placeholder="••••••••" 
                  required 
                />
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center"
              >
                {isLoading ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  isLogin ? "Se connecter" : "S'inscrire gratuitement"
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-slate-600">
              {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-blue-600 font-bold hover:underline ml-2 outline-none"
              >
                {isLogin ? "Créer un compte" : "Se connecter"}
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}