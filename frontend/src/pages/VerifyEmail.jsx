import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); 
  
  const [status, setStatus] = useState('loading'); 
  const [message, setMessage] = useState('');

  // NOUVEAU : Ce "ref" sert de mémoire pour bloquer le double appel de React StrictMode
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage("Lien de vérification manquant.");
      return;
    }

    // Si on a déjà fait l'appel, on s'arrête ici !
    if (hasFetched.current) return;
    hasFetched.current = true;

    const verifyToken = async () => {
      try {
        const response = await axios.get(`https://fdb-formations.vercel.app/api/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || "Erreur de vérification.");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center font-sans">
      <div className="bg-white p-10 rounded-sm shadow-xl border-t-4 border-[#EB0A1E] max-w-md w-full text-center">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-[#EB0A1E] border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-black text-slate-900 uppercase">Vérification en cours...</h2>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-in zoom-in">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase mb-2">Email Vérifié !</h2>
            <p className="text-slate-600 font-medium mb-8">
              Votre adresse email a bien été confirmée. Votre compte est maintenant en attente d'approbation par votre manager.
            </p>
            <Link to="/login" className="w-full py-4 bg-[#111827] text-white font-black uppercase tracking-widest text-xs rounded-sm hover:bg-[#EB0A1E] transition-colors">
              Retour à l'accueil
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-in zoom-in">
            <div className="w-20 h-20 bg-red-100 text-[#EB0A1E] rounded-full flex items-center justify-center mb-6 shadow-sm">
              <XCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase mb-2">Lien invalide</h2>
            <p className="text-slate-600 font-medium mb-8">
              {message}
            </p>
            <Link to="/login" className="w-full py-4 bg-slate-200 text-slate-700 font-black uppercase tracking-widest text-xs rounded-sm hover:bg-slate-300 transition-colors">
              Retour à l'accueil
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}