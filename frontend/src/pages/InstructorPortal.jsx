import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
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
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Image as ImageIcon,
  AlignLeft,
  Tag
} from 'lucide-react';

export default function InstructorPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]); 

  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Pour la barre de recherche
  
  const [activeTab, setActiveTab] = useState('COURSES'); 

  // Modale Création Cours
  const [isCreating, setIsCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', accessKey: '', imageUrl: '', categoryId: '', level: 'Débutant' });
  
  // Modale Branche
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryData, setCategoryData] = useState({ name: '', imageUrl: '' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!token || userData?.role !== 'INSTRUCTOR') {
      alert("Accès refusé. Réservé aux instructeurs.");
      navigate('/dashboard');
      return;
    }
    setUser(userData);
    fetchInstructorCourses(token);
  }, [navigate]);

  const fetchInstructorCourses = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/courses/instructor-courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const catRes = await axios.get('http://localhost:5000/api/categories');
      
      setCourses(response.data);
      setCategories(catRes.data);

      // --- NOUVEAU : RÉCUPÉRER TOUS LES ÉTUDIANTS ---
      // On boucle sur chaque cours pour récupérer ses étudiants via votre API existante
      const studentsPromises = response.data.map(course => 
        axios.get(`http://localhost:5000/api/courses/${course.id}/students`, {
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

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (editingCategory) {
        await axios.put(`http://localhost:5000/api/categories/${editingCategory.id}`, categoryData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        alert("Filière modifiée avec succès !");
      } else {
        await axios.post('http://localhost:5000/api/categories', categoryData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        alert("Filière créée avec succès !");
      }
      
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryData({ name: '', imageUrl: '' });
      fetchInstructorCourses(token); 
    } catch (error) {
      alert("Erreur (Cette filière existe peut-être déjà).");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette filière ? Ses cours seront déplacés vers 'Autres'.")) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInstructorCourses(token); 
    } catch (error) {
      alert("Erreur lors de la suppression de la filière.");
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/courses', newCourse, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsCreating(false);
      setNewCourse({ title: '', description: '', accessKey: '', imageUrl: '', categoryId: '', level: 'Débutant' });
      fetchInstructorCourses(token);
      alert("Formation créée avec succès !");
    } catch (error) {
      alert("Erreur lors de la création.");
    }
  };

  // Filtrer les étudiants pour la barre de recherche
  const filteredStudents = allStudents.filter(student => 
    student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <header className="md:hidden h-16 bg-white border-b border-slate-200 px-6 flex items-center sticky top-16 z-30 justify-between">
          <h2 className="text-lg font-black text-slate-900">{activeTab === 'COURSES' ? 'Formations' : 'Filières'}</h2>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('COURSES')} className={`p-2 rounded-lg ${activeTab === 'COURSES' ? 'bg-red-50 text-[#EB0A1E]' : 'text-slate-400'}`}><BookOpen className="w-5 h-5"/></button>
            <button onClick={() => setActiveTab('BRANCHES')} className={`p-2 rounded-lg ${activeTab === 'BRANCHES' ? 'bg-red-50 text-[#EB0A1E]' : 'text-slate-400'}`}><FolderKanban className="w-5 h-5"/></button>
            <button onClick={() => setActiveTab('STUDENTS')} className={`p-2 rounded-lg ${activeTab === 'STUDENTS' ? 'bg-red-50 text-[#EB0A1E]' : 'text-slate-400'}`}><Users className="w-5 h-5"/></button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
          
          {/* HEADER DE SECTION */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {activeTab === 'COURSES' ? 'Gestion des Formations' 
                 : activeTab === 'BRANCHES' ? 'Gestion des Filières' 
                 : 'Annuaire Global des Apprenants'}
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {activeTab === 'COURSES' ? 'Créez du contenu technique et suivez les certifications de vos équipes.' 
                 : activeTab === 'BRANCHES' ? 'Organisez vos modules par spécialités (ex: CACES, SAS, TPS).' 
                 : 'Visualisez les progressions de tous les collaborateurs inscrits à vos modules.'}
              </p>
            </div>
            {activeTab === 'COURSES' ? (
              <button 
                onClick={() => setIsCreating(true)} 
                className="px-5 py-2.5 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#EB0A1E] transition-all flex items-center gap-2 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nouveau Module</span>
              </button>
            ) : (
              <button 
                onClick={() => { setEditingCategory(null); setCategoryData({ name: '', imageUrl: '' }); setIsCategoryModalOpen(true); }} 
                className="px-5 py-2.5 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#EB0A1E] transition-all flex items-center gap-2 shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle Filière</span>
              </button>
            )}
             {activeTab === 'STUDENTS' && (
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Rechercher un apprenant..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#EB0A1E] focus:ring-2 focus:ring-red-100 text-sm font-semibold transition-all"
                />
              </div>
            )}
          </div>

          {/* ========================================= */}
          {/* ONGLET : SUIVI GLOBAL ÉTUDIANTS (NOUVEAU) */}
          {/* ========================================= */}
          {activeTab === 'STUDENTS' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-black">
                    <tr>
                      <th className="px-6 py-4">Collaborateur</th>
                      <th className="px-6 py-4">Formation Suivie</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4">Score Final</th>
                      <th className="px-6 py-4 text-right">Inscrit le</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                          <p className="text-slate-500 font-bold">Aucun apprenant trouvé.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((enrollment, index) => (
                        <tr key={`${enrollment.user.id}-${enrollment.courseId}-${index}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs shadow-sm overflow-hidden">
                              {enrollment.user.avatarUrl ? <img src={enrollment.user.avatarUrl} className="w-full h-full object-cover"/> : enrollment.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{enrollment.user.name}</p>
                              <p className="text-xs text-slate-500">{enrollment.user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-semibold text-slate-700 truncate max-w-[180px] block">{enrollment.courseTitle}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {enrollment.status === 'IN_PROGRESS' && <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold text-[9px] uppercase tracking-wider rounded-md border border-slate-200 flex items-center gap-1 w-max"><Clock className="w-3 h-3" /> En formation</span>}
                            {enrollment.status === 'VALIDATED' && <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[9px] uppercase tracking-wider rounded-md border border-emerald-100 flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Validé</span>}
                            {enrollment.status === 'FAILED' && <span className="px-2.5 py-1 bg-red-50 text-red-600 font-bold text-[9px] uppercase tracking-wider rounded-md border border-red-100 flex items-center gap-1 w-max"><XCircle className="w-3 h-3" /> Non validé</span>}
                          </td>
                          <td className="px-6 py-4">
                            {enrollment.finalGrade !== null ? (
                              <p className={`font-black text-sm ${enrollment.status === 'VALIDATED' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {enrollment.finalGrade} <span className="text-[9px] text-slate-400 font-bold">/ 20</span>
                              </p>
                            ) : (
                              <span className="text-slate-400 font-semibold text-xs">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-semibold text-slate-500">
                            {new Date(enrollment.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- ONGLET : COURS --- */}
          {activeTab === 'COURSES' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
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

    </div>
  );
}