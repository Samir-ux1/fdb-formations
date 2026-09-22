import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { KeyRound, X, AlertTriangle, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function RedeemModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthStore();
  
  const [accessKey, setAccessKey] = useState('');
  const [error, setError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const DEMO_KEYS = ['SAFETY24', 'TOY-2024-X', 'KAIZEN2026'];

  // Fonction pour fermer la modale et retirer "?modal=redeem" de l'URL
  const closeModal = () => {
    navigate(location.pathname, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsUnlocking(true);

    const formattedKey = accessKey.trim().toUpperCase();
    const activeToken = token || localStorage.getItem('token');

    if (!activeToken) {
      navigate('/login');
      return;
    }

    try {
      const coursesRes = await axios.get('https://fdb-formations.vercel.app/api/courses');
      const matchedCourse = coursesRes.data.find(c => c.accessKey.toUpperCase() === formattedKey);

      if (!matchedCourse) {
        setIsUnlocking(false);
        setError("Code secret invalide. Vérifiez le code fourni par votre superviseur.");
        return;
      }

      await axios.post(`https://fdb-formations.vercel.app/api/courses/${matchedCourse.id}/unlock`, { key: formattedKey }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });

      setIsSuccess(true);
      setIsUnlocking(false);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EB0A1E', '#111827', '#ffffff']
      });

      setTimeout(() => {
        closeModal();
        navigate(`/courses/${matchedCourse.id}`);
      }, 1500);

    } catch (err) {
      setIsUnlocking(false);
      setError(err.response?.data?.message || "Erreur lors de l'activation.");
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Bouton Fermer */}
        <button 
          onClick={closeModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* En-tête Modale (Design sombre) */}
        <div className="p-6 border-b border-slate-800 bg-[#111827] text-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EB0A1E] shadow-sm flex items-center justify-center text-white shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-white leading-tight">Clé d'accès requise</h3>
            <p className="text-xs text-slate-400 font-medium">Entrez le code d'accès de votre superviseur</p>
          </div>
        </div>

        {/* Corps de la Modale */}
        <div className="p-6">
          <div className="mb-4">
            <span className="inline-block px-3 py-0.5 bg-red-50 text-[#EB0A1E] text-[10px] font-bold uppercase tracking-wider rounded-full border border-red-100 mb-2">
              MAINTENANCE / SÉCURITÉ
            </span>
            <h4 className="font-bold text-base text-slate-900 mb-1">Activer une nouvelle formation Toyota</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pour débloquer ce contenu certifiant et accéder aux vidéos interactives, saisissez votre jeton ou clé d'accréditation.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 text-[#EB0A1E] text-xs rounded-xl font-semibold border border-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="mb-4 p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-bold border border-emerald-200 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Clé vérifiée avec succès ! Déblocage du cours...</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Code d'accès / Clé secrète
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => {
                    setAccessKey(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="EX: SAFETY24, TOY-2024-X"
                  disabled={isUnlocking || isSuccess}
                  className="w-full px-4 py-3.5 bg-white border-2 border-slate-200 rounded-xl focus:border-[#EB0A1E] outline-none font-mono text-base uppercase font-bold text-center tracking-widest transition-all placeholder:text-slate-300 placeholder:font-sans placeholder:tracking-normal"
                  required
                  autoFocus
                />
                <ShieldCheck className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isUnlocking || isSuccess}
                className="w-1/3 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-wider"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isUnlocking || isSuccess || !accessKey.trim()}
                className="w-2/3 py-3 bg-[#EB0A1E] text-white font-bold text-xs rounded-xl hover:bg-[#BD0014] transition-all disabled:opacity-50 flex justify-center items-center gap-2 shadow-md uppercase tracking-wider active:scale-95"
              >
                {isUnlocking ? "Vérification..." : "Débloquer le cours"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}