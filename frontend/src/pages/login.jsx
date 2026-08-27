import { useState } from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  ArrowRight,
  Loader2
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); 
    setIsLoading(true); 

    try {
      if (isLogin) {
        // --- 1. LOGIQUE DE CONNEXION ---
        const response = await axios.post('http://localhost:5000/api/auth/login', {
          email,
          password
        });
        
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        navigate('/'); 

      } else {
        // --- 2. LOGIQUE D'INSCRIPTION ---
        await axios.post('http://localhost:5000/api/auth/register', {
          name,
          email,
          password,
          role: 'STUDENT'
        });
        
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        setIsLogin(true); 
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Identifiants incorrects ou erreur serveur.');
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <main className="flex min-h-screen bg-white font-sans text-slate-900">
      
      {/* SECTION GAUCHE : IMAGE BRANDING TOYOTA */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#111827]">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-overlay" 
          style={{ backgroundImage: "url('https://toyotamaterialhandling-international.com/storage/CADA05EDC4097C0C622D13BB72D608DF246FE552BA02346ACAA4B5E756DE4ACA/518ff646ddeb41c282f49be249acd61b/png/media/39122e64c9fb4d69b14e2a5efa471e33/Service.png')" }}
        ></div>
        {/* Dégradé sombre pour faire ressortir le texte */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/80 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EB0A1E] flex items-center justify-center text-white shadow-lg">
              <span className="font-black text-sm tracking-tighter">FDB</span>
            </div>
            <span className="text-xl font-black tracking-tight">
              FORMATIONS <span className="text-[#EB0A1E]">Hub</span>
            </span>
          </div>
          
          <div className="max-w-md mb-10">
            <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight tracking-tight">
              L'Excellence <br/> <span className="text-[#EB0A1E]">Opérationnelle</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Connectez-vous pour accéder à vos modules d'habilitation, valider vos certifications techniques et développer vos compétences industrielles.
            </p>
          </div>
        </div>
      </section>
      
      {/* SECTION DROITE : FORMULAIRE */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md z-10">
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100 transition-all duration-500">
            
            <div className="mb-8">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">
                {isLogin ? "Espace Collaborateur" : "Créer un compte"}
              </h3>
              <p className="text-slate-500 text-sm font-medium">
                {isLogin ? "Renseignez vos identifiants pour accéder à vos formations." : "Inscrivez-vous pour rejoindre le programme de formation technique."}
              </p>
            </div>

            {/* Affichage des erreurs en rouge */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-[#EB0A1E] rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in zoom-in-95">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              
              {!isLogin && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Nom complet</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-800 focus:ring-2 focus:ring-slate-200 outline-none transition-all text-sm font-semibold text-slate-900" 
                      placeholder="Prénom & Nom" 
                      required={!isLogin} 
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">Adresse Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-800 focus:ring-2 focus:ring-slate-200 outline-none transition-all text-sm font-semibold text-slate-900" 
                    placeholder="collaborateur@email.com" 
                    required 
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Mot de passe</label>
                  {isLogin && <a href="#" className="text-[10px] font-bold text-[#EB0A1E] hover:underline">Code oublié ?</a>}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-slate-800 focus:ring-2 focus:ring-slate-200 outline-none transition-all text-sm font-semibold text-slate-900" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 py-3.5 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:bg-[#EB0A1E] active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? "Se connecter" : "S'inscrire"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs font-semibold text-slate-500">
                {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
                <button 
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="text-[#EB0A1E] font-black hover:underline ml-1.5 outline-none uppercase tracking-wider"
                >
                  {isLogin ? "Créer un profil" : "Me connecter"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}