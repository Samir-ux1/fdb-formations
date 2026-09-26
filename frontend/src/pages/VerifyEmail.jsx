import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage("Lien de vérification invalide ou expiré.");
      return;
    }

    const verifyToken = async () => {
      try {
        // Envoie le token au backend pour valider le compte
        await axios.post(`${import.meta.env.VITE_API_URL}/auth/verify-email`, { token });
        
        setStatus('success');
        setMessage("Votre adresse email a été vérifiée avec succès !");
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || "Le lien de vérification est invalide ou a expiré.");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white max-w-md w-full p-8 md:p-10 rounded-3xl shadow-xl border border-slate-200 text-center relative overflow-hidden">
        
        {/* Décoration Toyota */}
        <div className={`absolute top-0 left-0 w-full h-2 ${status === 'success' ? 'bg-emerald-500' : status === 'error' ? 'bg-[#EB0A1E]' : 'bg-[#111827]'}`}></div>

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center shadow-sm">
            {status === 'loading' && <Loader2 className="w-8 h-8 text-[#111827] animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-8 h-8 text-emerald-500" />}
            {status === 'error' && <XCircle className="w-8 h-8 text-[#EB0A1E]" />}
          </div>
        </div>

        <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
          {status === 'loading' ? 'Vérification en cours...' : 
           status === 'success' ? 'Email Vérifié !' : 
           'Échec de la vérification'}
        </h2>
        
        <p className="text-slate-500 font-medium mb-8">
          {status === 'loading' ? 'Veuillez patienter pendant que nous validons votre adresse email.' : message}
        </p>

        {status !== 'loading' && (
          <Link 
            to="/login"
            className="w-full py-4 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#EB0A1E] transition-all shadow-md flex justify-center items-center gap-2 active:scale-95"
          >
            <span>Se connecter à mon compte</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}