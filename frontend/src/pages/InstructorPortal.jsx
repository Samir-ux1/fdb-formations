import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  BookOpen, 
  FolderKanban, 
  Plus, 
  Settings, 
  KeyRound, 
  Users, 
  Target, 
  PlaySquare, 
  Edit,
  Search,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  AlignLeft,
  Tag,
  AlertTriangle,
  Download,
  Bell, 
  Filter
} from 'lucide-react';

export default function InstructorPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);

  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  
  const [activeTab, setActiveTab] = useState('COURSES'); 

  // Modale Création Cours
  const [isCreating, setIsCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', accessKey: '', imageUrl: '', categoryId: '', level: 'Débutant' });
  
  // Modale Branche
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryData, setCategoryData] = useState({ name: '', imageUrl: '' });

  const [pendingUsers, setPendingUsers] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  // États pour l'approbation d'un étudiant
  const [approvingUserId, setApprovingUserId] = useState(null);
  const [selectedSector, setSelectedSector] = useState('');
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || userData?.role !== 'INSTRUCTOR') {
      toast.success("Accès refusé. Réservé aux instructeurs.");
      navigate('/dashboard');
      return;
    }
    setUser(userData);
    fetchInstructorCourses(token);
  }, [navigate]);

  const fetchInstructorCourses = async (token) => {
    try {
      const response = await axios.get('https://fdb-formations.vercel.app/api/courses/instructor-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const catRes = await axios.get('https://fdb-formations.vercel.app/api/categories');
      
      const pendingRes = await axios.get('https://fdb-formations.vercel.app/api/users/pending', { headers: { Authorization: `Bearer ${token}` } });
      const studentsRes = await axios.get('https://fdb-formations.vercel.app/api/courses/instructor-students', { headers: { Authorization: `Bearer ${token}` } });
      setCourses(response.data);
      setCategories(catRes.data);
      setPendingUsers(pendingRes.data);
      setAllStudents(studentsRes.data);

      // --- NOUVEAU : RÉCUPÉRER TOUS LES ÉTUDIANTS ---
      // On boucle sur chaque cours pour récupérer ses étudiants via votre API existante
      const studentsPromises = response.data.map(course => 
        axios.get(`https://fdb-formations.vercel.app/api/courses/${course.id}/students`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => 
          // On ajoute le nom du cours à chaque étudiant pour l'affichage
          res.data.map(enrollment => ({ ...enrollment, courseTitle: course.title, courseId: course.id }))
        )
      );
      
      // On attend que toutes les requêtes se terminent et on fusionne tout dans un seul tableau
      const studentsArrays = await Promise.all(studentsPromises);
      const combinedStudents = studentsArrays.flat();
      
      // On trie par date d'inscription (les plus récents en premier)
      combinedStudents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setAllStudents(combinedStudents);
      
    } catch (error) {
      console.error("Erreur de récupération des cours", error);
    }
  };

  const handleReviewUser = async (userId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('https://fdb-formations.vercel.app/api/users/review', { userId, status, sector: status === 'APPROVED' ? selectedSector : null }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApprovingUserId(null);
      setSelectedSector('');
      fetchInstructorCourses(token); // Met à jour le compteur de notifications instantanément !
    } catch (error) {
      toast.success("Erreur lors de la validation.");
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (editingCategory) {
        await axios.put(`https://fdb-formations.vercel.app/api/categories/${editingCategory.id}`, categoryData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        toast.success("Filière modifiée avec succès !");
      } else {
        await axios.post('https://fdb-formations.vercel.app/api/categories', categoryData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        toast.success("Filière créée avec succès !");
      }
      
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryData({ name: '', imageUrl: '' });
      fetchInstructorCourses(token); 
    } catch (error) {
      toast.success("Erreur (Cette filière existe peut-être déjà).");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette filière ? Ses cours seront déplacés vers 'Autres'.")) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://fdb-formations.vercel.app/api/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInstructorCourses(token); 
    } catch (error) {
      toast.success("Erreur lors de la suppression de la filière.");
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('https://fdb-formations.vercel.app/api/courses', newCourse, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsCreating(false);
      setNewCourse({ title: '', description: '', accessKey: '', imageUrl: '', categoryId: '', level: 'Débutant' });
      fetchInstructorCourses(token);
      toast.success("Formation créée avec succès !");
    } catch (error) {
      toast.success("Erreur lors de la création.");
    }
  };

  // ========================================================
  // --- LOGIQUE RH (FILTRES ET KPI) SÉCURISÉE ---
  // ========================================================

  // 1. Fonction pour savoir si un technicien est en retard
  const isLate = (enrollment) => {
    if (enrollment?.status !== 'IN_PROGRESS' || !enrollment?.timeLimitDays) return false;
    const deadline = new Date(new Date(enrollment.createdAt).getTime() + enrollment.timeLimitDays * 24 * 60 * 60 * 1000);
    return new Date() > deadline;
  };

  // 2. Application des filtres (Sécurisé avec ?.)
  const filteredStudents = allStudents.filter(enrollment => {
    const userName = enrollment?.user?.name?.toLowerCase() || '';
    const courseTitle = enrollment?.courseTitle?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    const matchSearch = userName.includes(searchLower) || courseTitle.includes(searchLower);
    
    let matchStatus = true;
    if (statusFilter === 'LATE') matchStatus = isLate(enrollment);
    else if (statusFilter !== 'ALL') matchStatus = enrollment?.status === statusFilter;

    const matchSector = sectorFilter === 'ALL' || enrollment?.user?.sector === sectorFilter;

    return matchSearch && matchStatus && matchSector;
  });

  // 3. Calcul des KPI pour les graphiques (Nouveau Design)
  const kpiTotal = allStudents.length;
  const countValidated = allStudents.filter(e => e?.status === 'VALIDATED').length;
  const countFailed = allStudents.filter(e => e?.status === 'FAILED').length;
  const countLate = allStudents.filter(e => isLate(e)).length;
  const countInProgress = allStudents.filter(e => e?.status === 'IN_PROGRESS' && !isLate(e)).length;

  const pctValidated = kpiTotal > 0 ? Math.round((countValidated / kpiTotal) * 100) : 0;
  const pctFailedLate = kpiTotal > 0 ? Math.round(((countFailed + countLate) / kpiTotal) * 100) : 0;
  const pctInProgress = kpiTotal > 0 ? Math.round((countInProgress / kpiTotal) * 100) : 0;
  const kpiCompliance = pctValidated; // Pour la compatibilité

  // 4. Fonction d'Export Excel (CSV)
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nom,Email,Secteur,Formation,Statut,Note,Date_Inscription\n";

    filteredStudents.forEach(e => {
      const nom = e?.user?.name || "Inconnu";
      const email = e?.user?.email || "N/A";
      const secteur = e?.user?.sector || "Non assigné";
      const cours = e?.courseTitle || "Inconnu";
      const statut = isLate(e) ? "EN RETARD" : (e?.status || "N/A");
      const note = e?.finalGrade !== null && e?.finalGrade !== undefined ? `${e.finalGrade}/20` : "N/A";
      const date = e?.createdAt ? new Date(e.createdAt).toLocaleDateString('fr-FR') : "N/A";
      
      csvContent += `"${nom}","${email}","${secteur}","${cours}","${statut}","${note}","${date}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rapport_Formations_${new Date().toLocaleDateString('fr-FR')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 5. Fonction Relancer
  const handleRemindStudent = (name) => {
    toast.success(`Un email de relance automatique a été simulé pour ${name} ! 📧`);
  };

  // 6. Modifier le secteur d'un étudiant depuis la liste
  const handleUpdateSector = async (userId, newSector) => {
    try {
      const activeToken = token || localStorage.getItem('token');
      await axios.put(`https://fdb-formations.vercel.app/api/users/${userId}/sector`, { sector: newSector }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      fetchData(); // <-- CORRECTION : Recharge la liste complète des étudiants
      toast.success("Secteur mis à jour avec succès !");
    } catch (error) {
      toast.error("Erreur Secteur : " + (error.response?.data?.message || error.message)); // <-- CORRECTION : C'est bien une erreur !
    }
  };

  // 7. Extraire la liste unique des étudiants (pour éviter les doublons s'ils ont plusieurs cours)
  const uniqueStudents = [];
  const studentIds = new Set();
  if (allStudents) {
    allStudents.forEach(enrollment => {
      if (enrollment?.user && !studentIds.has(enrollment.user.id)) {
        studentIds.add(enrollment.user.id);
        uniqueStudents.push(enrollment.user);
      }
    });
  }

  
  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR GAUCHE */}
      <aside className="hidden md:flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-[#111827] text-white py-6 z-30 border-r border-slate-800 shadow-xl">
        <div className="px-6 mb-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Administration</span>
          <h2 className="text-lg font-black text-white mt-1 leading-tight">Portail<br/><span className="text-[#EB0A1E]">Formateur</span></h2>
        </div>

        <nav className="flex flex-col gap-2 px-4">
          <Link to="/dashboard" className="flex items-center gap-3 py-3 px-4 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-sm font-bold group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Mode Apprenant</span>
          </Link>
          
          <div className="h-px bg-slate-800 my-2 mx-4"></div>

          <button 
            onClick={() => setActiveTab('COURSES')} 
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'COURSES' ? 'bg-[#EB0A1E] text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Mes Formations</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('BRANCHES')} 
            className={`flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'BRANCHES' ? 'bg-[#EB0A1E] text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Filières & Branches</span>
          </button>

          {/* NOUVEAU BOUTON : SUIVI GLOBAL ÉTUDIANTS */}
          <button 
            onClick={() => setActiveTab('STUDENTS')} 
            className={`flex items-center justify-between py-3 px-4 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'STUDENTS' ? 'bg-[#EB0A1E] text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Suivi Étudiants</span>
            </div>
            <span className={`text-[10px] py-0.5 px-2 rounded-full ${activeTab === 'STUDENTS' ? 'bg-white text-[#EB0A1E]' : 'bg-slate-700 text-slate-300'}`}>
              {allStudents.length}
            </span>
          </button>
        </nav>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="md:ml-64 flex-1 pb-12 pt-16 md:pt-4">
        
        {/* En-tête mobile (caché sur desktop car sidebar) */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-20 z-30">
          <h2 className="text-xl font-bold">{activeTab === 'COURSES' ? 'Vos Formations' : activeTab === 'BRANCHES' ? 'Vos Branches' : 'Approbations'}</h2>
          
          <div className="flex items-center gap-6">
            {/* --- LE SYSTÈME DE NOTIFICATION 🔔 --- */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {/* Le Point Rouge s'il y a des gens en attente ! */}
                {pendingUsers.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                    {pendingUsers.length}
                  </span>
                )}
              </button>

              {/* Le menu déroulant des notifications */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-sm shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 font-bold text-sm">Notifications</div>
                  {pendingUsers.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500 text-center">Aucune nouvelle inscription.</div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {pendingUsers.map(u => (
                        <div key={u.id} className="p-4 border-b border-slate-50 hover:bg-slate-50">
                          <p className="text-sm font-bold text-slate-900">{u.name}</p>
                          <p className="text-[10px] text-slate-500 mb-3 uppercase tracking-wider">{u.email}</p>
                          
                          {/* SI ON CLIQUE SUR APPROUVER, ON AFFICHE LE CHOIX DU SECTEUR */}
                          {approvingUserId === u.id ? (
                            <div className="flex flex-col gap-2 mt-2 p-2 bg-slate-100 rounded-sm border border-slate-200">
                              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Affecter à un secteur :</label>
                              <select 
                                value={selectedSector} 
                                onChange={(e) => setSelectedSector(e.target.value)}
                                className="w-full p-1.5 text-xs border border-slate-300 rounded-sm outline-none focus:border-red-600"
                              >
                                <option value="">-- Choisir --</option>
                                <option value="Casablanca">Casablanca</option>
                                <option value="Tanger">Tanger</option>
                                <option value="Rabat">Rabat</option>
                                <option value="Marrakech">Marrakech</option>
                                <option value="Agadir">Agadir</option>
                                <option value="Autre">Autre région</option>
                              </select>
                              <div className="flex gap-2 mt-1">
                                <button onClick={() => handleReviewUser(u.id, 'APPROVED')} disabled={!selectedSector} className="flex-1 bg-green-600 text-white text-[10px] py-1.5 rounded-sm font-bold hover:bg-green-700 uppercase disabled:opacity-50">Valider</button>
                                <button onClick={() => setApprovingUserId(null)} className="flex-1 bg-slate-200 text-slate-600 text-[10px] py-1.5 rounded-sm font-bold hover:bg-slate-300 uppercase">Annuler</button>
                              </div>
                            </div>
                          ) : (
                            /* BOUTONS PAR DÉFAUT */
                            <div className="flex gap-2">
                              <button onClick={() => setApprovingUserId(u.id)} className="flex-1 bg-green-50 text-green-700 border border-green-200 text-xs py-1.5 rounded-sm font-bold hover:bg-green-100 transition-colors">Approuver</button>
                              <button onClick={() => handleReviewUser(u.id, 'REJECTED')} className="flex-1 bg-red-50 text-red-700 border border-red-200 text-xs py-1.5 rounded-sm font-bold hover:bg-red-100 transition-colors">Refuser</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* ------------------------------------- */}
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* HEADER SUPPRIMÉ POUR L'ONGLET RH ! On ne l'affiche que pour les cours et les branches */}
          {activeTab !== 'STUDENTS' && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-slate-900">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {activeTab === 'COURSES' ? 'Gestion des Formations' : 'Gestion des Filières'}
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                  {activeTab === 'COURSES' ? 'Créez du contenu technique et suivez les certifications de vos équipes.' : 'Organisez vos modules par spécialités (ex: CACES, SAS).'}
                </p>
              </div>
              
              {activeTab === 'COURSES' && (
                <button onClick={() => setIsCreatingCourse(true)} className="px-6 py-3 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-sm hover:bg-[#EB0A1E] transition-all flex items-center gap-2 shadow-md">
                  <Plus className="w-4 h-4" /> Nouveau Module
                </button>
              )}
              {activeTab === 'BRANCHES' && (
                <button onClick={() => { setEditingCategory(null); setCategoryData({ name: '', imageUrl: '' }); setIsCategoryModalOpen(true); }} className="px-6 py-3 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-sm hover:bg-[#EB0A1E] transition-all flex items-center gap-2 shadow-md">
                  <Plus className="w-4 h-4" /> Nouvelle Filière
                </button>
              )}
            </div>
          )}

          {/* ========================================= */}
          {/* ONGLET : SUIVI GLOBAL ÉTUDIANTS (VUE RH)  */}
          {/* ========================================= */}
          {activeTab === 'STUDENTS' && (
            <div className="space-y-6">
              
              {/* --- LES GRAPHIQUES VISUELS (CHARTS) --- */}
              <div className="bg-white p-8 rounded-sm border border-slate-200 shadow-sm border-t-4 border-t-[#EB0A1E]">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-8">Performance Globale</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                  
                  {/* Jauge Principale (Conformité) */}
                  <div className="flex flex-col items-center justify-center lg:border-r border-slate-100">
                     <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                       <svg className="w-full h-full transform -rotate-90">
                         <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                         <circle 
                            cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                            strokeDasharray="439.8" strokeDashoffset={439.8 - (439.8 * pctValidated) / 100} 
                            className="text-emerald-500 transition-all duration-1000 ease-out" 
                         />
                       </svg>
                       <div className="absolute flex flex-col items-center">
                         <span className="text-4xl font-black text-slate-900">{pctValidated}%</span>
                       </div>
                     </div>
                     <span className="text-xs uppercase font-black tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-sm">Conformité</span>
                  </div>

                  {/* Barres de répartition horizontales */}
                  <div className="lg:col-span-2 flex flex-col justify-center space-y-6">
                     <div>
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                         <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Certifiés ({countValidated})</span>
                         <span className="text-slate-900">{pctValidated}%</span>
                       </div>
                       <div className="w-full h-3 bg-slate-100 rounded-sm overflow-hidden">
                         <div className="h-full bg-emerald-500 transition-all duration-1000" style={{width: `${pctValidated}%`}}></div>
                       </div>
                     </div>
                     
                     <div>
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                         <span className="text-blue-600 flex items-center gap-1"><Clock className="w-3 h-3"/> En formation ({countInProgress})</span>
                         <span className="text-slate-900">{pctInProgress}%</span>
                       </div>
                       <div className="w-full h-3 bg-slate-100 rounded-sm overflow-hidden">
                         <div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${pctInProgress}%`}}></div>
                       </div>
                     </div>

                     <div>
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                         <span className="text-[#EB0A1E] flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Échecs & Retards ({countFailed + countLate})</span>
                         <span className="text-slate-900">{pctFailedLate}%</span>
                       </div>
                       <div className="w-full h-3 bg-slate-100 rounded-sm overflow-hidden">
                         <div className="h-full bg-[#EB0A1E] transition-all duration-1000" style={{width: `${pctFailedLate}%`}}></div>
                       </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* BARRE DE FILTRES ET D'EXPORT */}
              <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
                
                <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Rechercher matricule, cours..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-sm font-semibold focus:border-[#EB0A1E] outline-none" />
                  </div>
                  
                  <div className="relative">
                    <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} className="w-full md:w-auto pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold uppercase tracking-wider focus:border-[#EB0A1E] outline-none appearance-none text-slate-700">
                      <option value="ALL">Tous les secteurs</option>
                      <option value="Casablanca">Casablanca</option>
                      <option value="Tanger">Tanger</option>
                      <option value="Rabat">Rabat</option>
                      <option value="Marrakech">Marrakech</option>
                      <option value="Agadir">Agadir</option>
                    </select>
                  </div>

                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full md:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-sm text-xs font-bold uppercase tracking-wider focus:border-[#EB0A1E] outline-none text-slate-700">
                    <option value="ALL">Tous les statuts</option>
                    <option value="VALIDATED">Certifiés uniquement</option>
                    <option value="IN_PROGRESS">En cours</option>
                    <option value="LATE">⚠️ En Retard</option>
                    <option value="FAILED">Échecs</option>
                  </select>
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                  <button onClick={() => setIsSectorModalOpen(true)} className="flex-1 lg:flex-none px-6 py-2.5 bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-sm hover:bg-slate-200 transition-colors border border-slate-300">
                    ⚙️ Gérer Affectations
                  </button>
                  <button onClick={handleExportCSV} className="flex-1 lg:flex-none px-6 py-2.5 bg-[#111827] text-white font-black text-[10px] uppercase tracking-widest rounded-sm hover:bg-[#EB0A1E] transition-colors flex items-center justify-center gap-2 shadow-md">
                    <Download className="w-3.5 h-3.5" /> Export Excel
                  </button>
                </div>

              </div>

              {/* LE GRAND TABLEAU */}
              <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                <div className="w-full max-w-full overflow-x-auto pb-2 custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap min-w-[800px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-black">
                      <tr className="hover:bg-slate-50 transition-colors relative hover:z-50">
                        <th className="px-6 py-4">Collaborateur</th>
                        <th className="px-6 py-4">Secteur</th>
                        <th className="px-6 py-4">Module</th>
                        <th className="px-6 py-4">Statut</th>
                        <th className="px-6 py-4">Score</th>
                        <th className="px-6 py-4 text-right">Actions RH</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {(!filteredStudents || filteredStudents.length === 0) ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center">
                            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 font-bold text-sm">Aucun collaborateur trouvé.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((enrollment, index) => {
                          const retard = isLate(enrollment);
                          return (
                          <tr key={enrollment?.id || index} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-sm bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs shadow-sm overflow-hidden border border-slate-200">
                                {enrollment?.user?.avatarUrl ? <img src={enrollment.user.avatarUrl} className="w-full h-full object-cover"/> : enrollment?.user?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{enrollment?.user?.name || 'Inconnu'}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{enrollment?.user?.email}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-600 text-[10px] uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-sm border border-slate-200">
                                {enrollment?.user?.sector || 'Non assigné'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold text-slate-700 truncate max-w-[150px] block">{enrollment?.courseTitle}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {retard ? (
                                <span className="px-2.5 py-1 bg-red-100 text-[#EB0A1E] font-black text-[9px] uppercase tracking-wider rounded-sm border border-red-200 flex items-center gap-1 w-max"><AlertTriangle className="w-3 h-3" /> Hors délai</span>
                              ) : enrollment?.status === 'IN_PROGRESS' ? (
                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-[9px] uppercase tracking-wider rounded-sm border border-blue-200 flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> En cours</span>
                              ) : enrollment?.status === 'VALIDATED' ? (
                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[9px] uppercase tracking-wider rounded-sm border border-emerald-200 flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Certifié</span>
                              ) : (
                                <span className="px-2.5 py-1 bg-orange-50 text-orange-700 font-bold text-[9px] uppercase tracking-wider rounded-sm border border-orange-200 flex items-center gap-1 w-max"><XCircle className="w-3 h-3" /> Échec</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {enrollment?.finalGrade !== null && enrollment?.finalGrade !== undefined ? (
                                <p className={`font-black text-sm ${enrollment?.status === 'VALIDATED' ? 'text-emerald-600' : 'text-[#EB0A1E]'}`}>
                                  {enrollment.finalGrade} <span className="text-[9px] text-slate-400 font-bold">/ 20</span>
                                </p>
                              ) : (
                                <span className="text-slate-300 font-bold">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {retard && (
                                <button onClick={() => handleRemindStudent(enrollment?.user?.name)} className="px-3 py-1.5 bg-[#111827] text-white font-bold text-[10px] uppercase tracking-widest rounded-sm hover:bg-[#EB0A1E] transition-colors flex items-center gap-1.5 ml-auto">
                                  <Bell className="w-3 h-3" /> Relancer
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* --- ONGLET : COURS --- */}
          {activeTab === 'COURSES' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-visible">
              <div className="w-full max-w-full overflow-visible pb-4 custom-scrollbar">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-black">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-3xl">Module Technique</th>
                      <th className="px-6 py-4">Clé Secrète</th>
                      <th className="px-6 py-4">Contenu</th>
                      <th className="px-6 py-4">Inscrits</th>
                      <th className="px-6 py-4">Réussite</th>
                      <th className="px-6 py-4 text-right rounded-tr-3xl">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {courses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 font-bold">Aucune formation créée pour le moment.</p>
                        </td>
                      </tr>
                    ) : (
                      courses.map(course => (
                        <tr key={course.id} className="hover:bg-slate-50 transition-colors group/row">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-red-50 text-[#EB0A1E] flex items-center justify-center shrink-0">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <span className="truncate max-w-[200px]">{course.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-black tracking-widest rounded-lg border border-slate-200 flex items-center gap-1.5 w-max">
                              <KeyRound className="w-3 h-3 text-slate-400" />
                              {course.accessKey}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-semibold text-xs flex items-center gap-1.5 mt-2">
                            <PlaySquare className="w-4 h-4 text-slate-400" />
                            {course._count.lessons} Chapitres
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-semibold text-xs">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-slate-400" />
                              {course._count.enrollments}
                            </div>
                          </td>
                          <td className="px-6 py-4 relative group">
                            {course.successRate !== null ? (
                              <div className="flex items-center gap-2 cursor-help">
                                <Target className={`w-4 h-4 ${course.successRate >= 70 ? 'text-emerald-500' : 'text-[#EB0A1E]'}`} />
                                <span className={`font-black ${course.successRate >= 70 ? 'text-emerald-600' : 'text-[#EB0A1E]'}`}>
                                  {course.successRate}%
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  ({course.totalEvaluated})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs font-semibold italic flex items-center gap-1 cursor-help">
                                <Clock className="w-3.5 h-3.5" /> Pas d'éval.
                              </span>
                            )}

                            {/* L'INFO-BULLE (Tooltip) */}
                            <div className="absolute bottom-full left-6 mb-2 w-60 p-4 bg-[#111827] text-white text-xs rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl pointer-events-none">
                              <p className="font-black mb-3 border-b border-slate-700 pb-2 text-slate-200 uppercase tracking-wider text-[10px]">
                                Détails des étudiants ({course._count.enrollments})
                              </p>
                              
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> Validés :</span>
                                <span className="font-black text-emerald-400 text-sm">{course.validatedCount}</span>
                              </div>
                              
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-slate-400 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-red-500"/> Échecs :</span>
                                <span className="font-black text-red-400 text-sm">{course.failedCount}</span>
                              </div>
                              
                              <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                                <span className="text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-blue-400"/> En cours :</span>
                                <span className="font-black text-blue-400 text-sm">{course.inProgressCount}</span>
                              </div>

                              <div className="absolute top-full left-8 border-[6px] border-transparent border-t-[#111827]"></div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => navigate(`/instructor/courses/${course.id}`)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-[#EB0A1E] text-slate-700 hover:text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                            >
                              <Settings className="w-3.5 h-3.5" />
                              <span>Gérer</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- ONGLET : BRANCHES (FILIÈRES) --- */}
          {activeTab === 'BRANCHES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.length === 0 && (
                <div className="col-span-3 text-center py-12 bg-white rounded-3xl border border-slate-200">
                  <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">Aucune filière créée. Commencez par en ajouter une.</p>
                </div>
              )}
              {categories.map(cat => (
                <div key={cat.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group">
                  <div className="h-32 relative bg-slate-100 overflow-hidden">
                    <img src={cat.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800"} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                    <div className="absolute bottom-3 left-4">
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                        Spécialité
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-black text-lg text-slate-900 mb-1 truncate">{cat.name}</h3>
                    <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mb-5">
                      <BookOpen className="w-3.5 h-3.5" />
                      {cat._count?.courses || 0} module(s) lié(s)
                    </p>
                    
                    <div className="mt-auto grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => { setEditingCategory(cat); setCategoryData({ name: cat.name, imageUrl: cat.imageUrl || '' }); setIsCategoryModalOpen(true); }} 
                        className="py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Modifier
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(cat.id)} 
                        className="py-2 bg-red-50 text-[#EB0A1E] hover:bg-red-100 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODALE : CRÉATION DE COURS */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#EB0A1E] rounded-t-3xl"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 text-[#EB0A1E] rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Nouveau Module</h3>
            </div>
            
            <form onSubmit={handleCreateCourse} className="space-y-4">
              {/* LA NOUVELLE GRILLE : Filière + Niveau */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    <FolderKanban className="w-3.5 h-3.5" /> Filière
                  </label>
                  <select 
                    value={newCourse.categoryId} 
                    onChange={(e) => setNewCourse({...newCourse, categoryId: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-red-100 text-sm font-semibold transition-all"
                    required
                  >
                    <option value="">-- Sans spécialité --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    <Target className="w-3.5 h-3.5" /> Niveau
                  </label>
                  <select 
                    value={newCourse.level} 
                    onChange={(e) => setNewCourse({...newCourse, level: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-red-100 text-sm font-semibold transition-all"
                    required
                  >
                    <option value="Débutant">Débutant</option>
                    <option value="Intermédiaire">Intermédiaire</option>
                    <option value="Avancé">Avancé</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  <Tag className="w-3.5 h-3.5" /> Titre de la formation
                </label>
                <input 
                  type="text" 
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-red-100 text-sm transition-all" 
                  placeholder="Ex: CACES R489 Catégorie 3"
                  required
                />
              </div>
              
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  <AlignLeft className="w-3.5 h-3.5" /> Description
                </label>
                <textarea 
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-red-100 text-sm h-24 resize-none transition-all" 
                  placeholder="Objectifs pédagogiques..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    <KeyRound className="w-3.5 h-3.5" /> Clé d'accès
                  </label>
                  <input 
                    type="text" 
                    value={newCourse.accessKey}
                    onChange={(e) => setNewCourse({...newCourse, accessKey: e.target.value.toUpperCase()})}
                    placeholder="TYT-26"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-red-100 font-mono font-bold uppercase text-center transition-all text-sm" 
                    required
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> URL Image
                  </label>
                  <input 
                    type="url" 
                    value={newCourse.imageUrl}
                    onChange={(e) => setNewCourse({...newCourse, imageUrl: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-red-100 text-sm transition-all" 
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsCreating(false)} className="w-1/3 py-3.5 bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit" className="w-2/3 py-3.5 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#EB0A1E] transition-colors shadow-md flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Créer le cours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE : GESTION BRANCHE */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#111827] rounded-t-3xl"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center">
                {editingCategory ? <Edit className="w-5 h-5" /> : <FolderKanban className="w-5 h-5" />}
              </div>
              <h3 className="text-xl font-black text-slate-900">{editingCategory ? 'Modifier la Filière' : 'Nouvelle Filière'}</h3>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  <Tag className="w-3.5 h-3.5" /> Nom de la filière
                </label>
                <input 
                  type="text" 
                  value={categoryData.name} 
                  onChange={e => setCategoryData({...categoryData, name: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm font-semibold transition-all" 
                  placeholder="Ex: Système Actif de Stabilité (SAS)"
                  required 
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Image (URL)
                </label>
                <input 
                  type="url" 
                  value={categoryData.imageUrl} 
                  onChange={e => setCategoryData({...categoryData, imageUrl: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm transition-all" 
                  placeholder="https://images.unsplash.com/..."
                  required 
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="w-1/3 py-3.5 bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit" className="w-2/3 py-3.5 bg-[#EB0A1E] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#BD0014] transition-colors shadow-md flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* MODALE : GESTION DES SECTEURS DES INSCRITS */}
      {/* ========================================================= */}
      {isSectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh] border-t-4 border-[#EB0A1E]">
            
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Gestion des Secteurs</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Modifiez l'affectation de vos {uniqueStudents.length} techniciens.</p>
              </div>
              <button onClick={() => setIsSectorModalOpen(false)} className="w-8 h-8 bg-white border border-slate-300 rounded-sm text-slate-500 hover:bg-slate-200 hover:text-slate-900 font-bold transition-colors">
                X
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                {uniqueStudents.length === 0 ? (
                  <p className="text-center text-slate-500 italic p-6">Aucun technicien inscrit pour le moment.</p>
                ) : (
                  uniqueStudents.map(student => (
                    <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-sm hover:border-[#EB0A1E] transition-colors gap-4">
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm bg-slate-200 border border-slate-300 flex items-center justify-center font-black text-slate-600 overflow-hidden shrink-0">
                          {student.avatarUrl ? <img src={student.avatarUrl} className="w-full h-full object-cover"/> : student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{student.email}</p>
                        </div>
                      </div>

                      <div className="shrink-0 w-full sm:w-48">
                        <select 
                          value={student.sector || ''} 
                          onChange={(e) => handleUpdateSector(student.id, e.target.value)}
                          className="w-full px-3 py-2 text-xs font-bold uppercase tracking-wider bg-white border border-slate-300 rounded-sm outline-none focus:border-[#EB0A1E] focus:ring-1 focus:ring-[#EB0A1E]"
                        >
                          <option value="">-- Non Assigné --</option>
                          <option value="Casablanca">Casablanca</option>
                          <option value="Tanger">Tanger</option>
                          <option value="Rabat">Rabat</option>
                          <option value="Marrakech">Marrakech</option>
                          <option value="Agadir">Agadir</option>
                        </select>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button onClick={() => setIsSectorModalOpen(false)} className="px-6 py-2.5 bg-[#111827] text-white text-xs font-black uppercase tracking-widest rounded-sm hover:bg-[#EB0A1E] transition-colors">
                Terminer
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}