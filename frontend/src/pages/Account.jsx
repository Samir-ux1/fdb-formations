import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Les champs du formulaire (incluant l'avatar)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    avatarUrl: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // On pré-remplit le formulaire avec les données existantes
      setFormData({
        firstName: parsedUser.firstName || '',
        lastName: parsedUser.lastName || '',
        phone: parsedUser.phone || '',
        birthDate: parsedUser.birthDate || '',
        avatarUrl: parsedUser.avatarUrl || '' // <-- Le lien de l'image
      });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastCourseId');
    window.location.href = '/login'; 
  };

  // Fonction pour envoyer les modifications au Backend
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('token');
      
      // APPEL À LOCALHOST SUR LA NOUVELLE ROUTE USER
      const response = await axios.put('http://localhost:5000/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // On met à jour le LocalStorage et l'affichage avec les nouvelles infos
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSuccessMsg("Votre profil a été mis à jour avec succès !");
      
      // On efface le message de succès après 3 secondes
      setTimeout(() => setSuccessMsg(''), 3000);
      
    } catch (error) {
      console.error(error);
      // On affiche LE VRAI message d'erreur du backend
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message;
      alert("Erreur du serveur : " + errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <div className="p-8 text-center text-slate-500 font-bold mt-20">Chargement...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans text-slate-800">
      
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mon Compte</h1>
        <p className="text-slate-500 mt-2">Gérez vos informations personnelles et vos coordonnées.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CARTE DE PROFIL (À gauche) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center flex flex-col items-center sticky top-24">
            
            {/* AFFICHAGE DE LA PHOTO DE PROFIL */}
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profil" className="w-24 h-24 rounded-full object-cover mb-4 shadow-inner border-4 border-white" />
            ) : (
              <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold mb-4 shadow-inner border-4 border-white">
                {user.firstName ? user.firstName.charAt(0).toUpperCase() : user.name.charAt(0).toUpperCase()}
              </div>
            )}

            <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
            <p className="text-slate-500 text-sm mb-4 line-clamp-1">{user.email}</p>
            
            <div className="inline-block px-4 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full uppercase tracking-wider mb-8">
              Rôle : {user.role === 'INSTRUCTOR' ? 'Instructeur' : 'Étudiant'}
            </div>

            <button onClick={handleLogout} className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
              Se déconnecter
            </button>
          </div>
        </div>

        {/* FORMULAIRE DE MODIFICATION (À droite) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold mb-6 border-b border-slate-100 pb-4">Informations personnelles</h3>
            
            {/* Message de succès vert */}
            {successMsg && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center gap-2 border border-green-200 animate-in fade-in">
                <span>✓</span> {successMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Prénom</label>
                  <input 
                    type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" 
                    placeholder="Votre prénom" required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nom de famille</label>
                  <input 
                    type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" 
                    placeholder="Votre nom" required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date de naissance</label>
                  <input 
                    type="date" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all text-slate-600" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Numéro de téléphone</label>
                  <input 
                    type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" 
                    placeholder="+33 6 12 34 56 78" 
                  />
                </div>
              </div>

              {/* NOUVEAU CHAMP : AVATAR */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Photo de profil (Lien URL)</label>
                <input 
                  type="url" value={formData.avatarUrl} onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all" 
                  placeholder="https://images.unsplash.com/..." 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Adresse Email (Fixe)</label>
                <input 
                  type="email" value={user.email} disabled
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 cursor-not-allowed" 
                />
              </div>

              {/* SECTEUR D'AFFECTATION */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Secteur d'affectation</label>
                <input 
                  type="text" 
                  value={user.sector || 'Non affecté'} 
                  disabled 
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-sm text-slate-500 font-bold cursor-not-allowed uppercase" 
                />
                <p className="text-[10px] text-slate-400 mt-1">Géré par votre administrateur.</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit" disabled={isSaving}
                  className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-1 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSaving ? "Sauvegarde en cours..." : "Enregistrer les modifications"}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}