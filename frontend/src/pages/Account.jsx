import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Upload, Trash2, User, Check, AlertCircle } from 'lucide-react';

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);
  
  // Les champs du formulaire (incluant l'avatar sous forme d'URL ou base64)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    avatarUrl: ''
  });

  const [previewAvatar, setPreviewAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      const initialAvatar = parsedUser.avatarUrl || '';
      setPreviewAvatar(initialAvatar);

      // On pré-remplit le formulaire avec les données existantes
      setFormData({
        firstName: parsedUser.firstName || '',
        lastName: parsedUser.lastName || '',
        phone: parsedUser.phone || '',
        birthDate: parsedUser.birthDate || '',
        avatarUrl: initialAvatar
      });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastCourseId');
    window.location.href = '/login'; 
  };

  /**
   * Gestion de l'upload depuis les dossiers de l'ordinateur ou la galerie photo
   */
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Vérification du type (fichiers images uniquement)
    if (!file.type.startsWith('image/')) {
      alert("Veuillez sélectionner un fichier image valide (JPG, PNG, WebP, etc.).");
      return;
    }

    // 2. Vérification de la taille (max 5 Mo)
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image est trop volumineuse (maximum 5 Mo).");
      return;
    }

    // 3. Conversion immédiate en Base64 (Data URL) pour prévisualisation et sauvegarde
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      setPreviewAvatar(base64Data);
      setFormData(prev => ({
        ...prev,
        avatarUrl: base64Data
      }));
    };
    reader.readAsDataURL(file);
  };

  /**
   * Supprimer la photo de profil actuelle
   */
  const handleRemoveAvatar = () => {
    setPreviewAvatar('');
    setFormData(prev => ({ ...prev, avatarUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fonction pour envoyer les modifications au Backend
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put('http://localhost:5000/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Mise à jour du LocalStorage et de l'état
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPreviewAvatar(updatedUser.avatarUrl || '');
      
      setSuccessMsg("Votre profil a été mis à jour avec succès !");
      setTimeout(() => setSuccessMsg(''), 3500);
      
    } catch (error) {
      console.warn("Erreur serveur :", error);
      // Secours local si le backend ne répond pas
      const updatedUser = {
        ...(user || {}),
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim() || user?.name || ''
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setSuccessMsg("Profil et photo enregistrés localement avec succès !");
      setTimeout(() => setSuccessMsg(''), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return <div className="p-8 text-center text-slate-500 font-bold mt-20">Chargement...</div>;

  const currentAvatar = previewAvatar || formData.avatarUrl || user.avatarUrl;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto font-sans text-slate-800 pb-20">
      
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Mon Compte</h1>
        <p className="text-slate-500 mt-2">Gérez vos informations personnelles et votre photo de profil.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CARTE DE PROFIL (À gauche) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center flex flex-col items-center sticky top-24">
            
            {/* ZONE AVATAR AVEC BADGE CAMÉRA CLIQUABLE */}
            <div className="relative group mb-4">
              {currentAvatar ? (
                <img 
                  src={currentAvatar} 
                  alt="Profil" 
                  className="w-28 h-28 rounded-full object-cover shadow-md border-4 border-white ring-2 ring-slate-100" 
                />
              ) : (
                <div className="w-28 h-28 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl font-black shadow-inner border-4 border-white ring-2 ring-slate-100">
                  {user.firstName ? user.firstName.charAt(0).toUpperCase() : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                </div>
              )}

              {/* Bouton raccourci flottant pour ouvrir l'explorateur de fichiers */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg border-2 border-white transition-transform active:scale-95 cursor-pointer"
                title="Choisir une image depuis l'ordinateur ou la galerie"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-slate-900">{user.name || `${formData.firstName} ${formData.lastName}`}</h2>
            <p className="text-slate-500 text-sm mb-4 line-clamp-1">{user.email}</p>
            
            <div className="inline-block px-4 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full uppercase tracking-wider mb-6">
              Rôle : {user.role === 'INSTRUCTOR' ? 'Instructeur' : 'Technicien / Étudiant'}
            </div>

            {/* Boutons d'action sous la carte */}
            <div className="w-full space-y-2 mb-6">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Téléverser une photo
              </button>

              {currentAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="w-full py-2 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Retirer la photo
                </button>
              )}
            </div>

            <button 
              onClick={handleLogout} 
              className="w-full py-3 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        {/* FORMULAIRE DE MODIFICATION (À droite) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold mb-6 border-b border-slate-100 pb-4 text-slate-900">
              Informations personnelles
            </h3>
            
            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-bold flex items-center gap-2.5 border border-emerald-200 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-bold flex items-center gap-2.5 border border-red-200 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* NOUVELLE ZONE D'IMPORTATION DE FICHIER (ORDINATEUR OU GALERIE) */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Photo de profil (Fichier ou Galerie)
                </label>
                
                {/* Input de fichier masqué */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp" 
                  onChange={handleImageFileChange}
                  className="hidden" 
                />

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    {currentAvatar ? (
                      <img src={currentAvatar} alt="Aperçu" className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {previewAvatar ? "Nouvelle photo sélectionnée" : (formData.avatarUrl ? "Photo configurée" : "Aucune photo")}
                      </p>
                      <p className="text-xs text-slate-400">JPG, PNG ou WebP (max. 5 Mo)</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:ml-auto">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> Parcourir l'ordinateur...
                    </button>

                    {currentAvatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        className="p-2.5 bg-white border border-slate-300 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600 rounded-xl transition-colors cursor-pointer"
                        title="Effacer la photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Option URL Web alternative */}
                <div className="mt-3 pt-3 border-t border-slate-200/60">
                  <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                    Ou saisissez une URL d'image web :
                  </span>
                  <input 
                    type="url" 
                    value={formData.avatarUrl.startsWith('data:') ? '' : formData.avatarUrl} 
                    onChange={(e) => {
                      setFormData({...formData, avatarUrl: e.target.value});
                      setPreviewAvatar(e.target.value);
                    }}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 transition-all text-slate-600" 
                    placeholder="https://exemple.com/photo.jpg" 
                  />
                </div>
              </div>

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
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold cursor-not-allowed uppercase" 
                />
                <p className="text-[10px] text-slate-400 mt-1">Géré par votre administrateur.</p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit" disabled={isSaving}
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:hover:translate-y-0 cursor-pointer"
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