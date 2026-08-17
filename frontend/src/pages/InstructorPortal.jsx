import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function InstructorPortal() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]); // Les branches
  
  // NOUVEAU : État pour gérer les onglets (Cours ou Branches)
  const [activeTab, setActiveTab] = useState('COURSES'); 

  // États pour la création d'un nouveau cours
  const [isCreating, setIsCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', accessKey: '', imageUrl: '', categoryId: '' });
  
  // NOUVEAU : États pour la création et modification d'une branche (avec image)
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
      
    } catch (error) {
      console.error("Erreur de récupération des cours", error);
    }
  };

  // --- GÉRER LES BRANCHES (CRÉATION ET MODIFICATION) ---
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (editingCategory) {
        // Mode Modification
        await axios.put(`http://localhost:5000/api/categories/${editingCategory.id}`, categoryData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        alert("Branche modifiée avec succès !");
      } else {
        // Mode Création
        await axios.post('http://localhost:5000/api/categories', categoryData, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        alert("Branche créée avec succès !");
      }
      
      // On ferme la fenêtre et on rafraîchit la liste
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryData({ name: '', imageUrl: '' });
      fetchInstructorCourses(token); 
    } catch (error) {
      alert("Erreur (Cette branche existe peut-être déjà).");
    }
  };

  // --- SUPPRIMER UNE BRANCHE ---
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette branche ? Ses cours seront déplacés vers 'Autres'.")) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchInstructorCourses(token); // Rafraîchit l'affichage
    } catch (error) {
      alert("Erreur lors de la suppression de la branche.");
    }
  };

  // --- GÉRER LES COURS ---
  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/courses', newCourse, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsCreating(false);
      setNewCourse({ title: '', description: '', accessKey: '', imageUrl: '', categoryId: '' });
      fetchInstructorCourses(token); // On rafraîchit la liste
      alert("Formation créée avec succès !");
    } catch (error) {
      alert("Erreur lors de la création.");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR GAUCHE */}
      <aside className="hidden md:flex flex-col fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-slate-900 text-white py-6 z-40">
        
        
        <nav className="flex flex-col gap-2 px-4">
          <Link to="/dashboard" className="flex items-center gap-3 py-3 px-4 text-slate-300 hover:bg-slate-800 rounded-xl transition-colors">
            <span>← Mode Étudiant</span>
          </Link>
          <button onClick={() => setActiveTab('COURSES')} className={`text-left py-3 px-4 rounded-xl font-bold transition-colors ${activeTab === 'COURSES' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📚 Mes Formations</button>
          <button onClick={() => setActiveTab('BRANCHES')} className={`text-left py-3 px-4 rounded-xl font-bold transition-colors ${activeTab === 'BRANCHES' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>📂 Mes Branches</button>
        </nav>
        
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="md:ml-64 flex-1 pb-12">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center sticky top-20 z-30">
          <h2 className="text-xl font-bold">{activeTab === 'COURSES' ? 'Vos Formations' : 'Vos Branches'}</h2>
        </header>
        <div className="p-8 max-w-6xl mx-auto space-y-8">
          
          {activeTab === 'COURSES' && (
            <>
              <button onClick={() => setIsCreating(true)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">+ Créer une formation</button>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-slate-500 mt-2">Gérez votre contenu et surveillez vos inscriptions.</p>
            </div>
          </div>

          {/* TABLEAU DES COURS */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-6 py-4">Nom de la formation</th>
                  <th className="px-6 py-4">Clé Secrète</th>
                  <th className="px-6 py-4">Leçons</th>
                  <th className="px-6 py-4">Inscrits</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      Vous n'avez pas encore créé de formation.
                    </td>
                  </tr>
                ) : (
                  courses.map(course => (
                    <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {course.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 font-mono text-xs rounded-lg border border-slate-200">
                          {course.accessKey}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {course._count.lessons} vidéos
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {course._count.enrollments} étudiants
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* Plus tard on fera le bouton pour ajouter des vidéos ici */}
                        <button 
                            onClick={() => navigate(`/instructor/courses/${course.id}`)}
                            className="text-blue-600 font-bold hover:underline text-xs">
                                Gérer le contenu
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </>
        )}

        {activeTab === 'BRANCHES' && (
            <>
              <button onClick={() => { setEditingCategory(null); setCategoryData({ name: '', imageUrl: '' }); setIsCategoryModalOpen(true); }} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">+ Créer une branche</button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map(cat => (
                  <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-32 object-cover bg-slate-100" />
                    <div className="p-4">
                      <h3 className="font-bold text-lg">{cat.name}</h3>
                      <p className="text-sm text-slate-500 mb-4">{cat._count?.courses || 0} formation(s)</p>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCategory(cat); setCategoryData({ name: cat.name, imageUrl: cat.imageUrl || '' }); setIsCategoryModalOpen(true); }} className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold w-1/2">Modifier</button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold w-1/2">Supprimer</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </main>

      {/* MODALE CRÉATION DE COURS */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-6">Nouvelle Formation</h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Branche (Catégorie)</label>
                <select 
                  value={newCourse.categoryId} 
                  onChange={(e) => setNewCourse({...newCourse, categoryId: e.target.value})}
                  className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                  required
                >
                  <option value="">-- Choisir une branche --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Titre de la formation</label>
                <input 
                  type="text" 
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea 
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none h-24" required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Clé Secrète (Access Key)</label>
                <input 
                  type="text" 
                  value={newCourse.accessKey}
                  onChange={(e) => setNewCourse({...newCourse, accessKey: e.target.value.toUpperCase()})}
                  placeholder="Ex: PRO2026"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none font-mono uppercase" required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Lien de l'image (URL)</label>
                <input 
                  type="url" 
                  value={newCourse.imageUrl}
                  onChange={(e) => setNewCourse({...newCourse, imageUrl: e.target.value})}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none" 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsCreating(false)} className="w-1/2 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Annuler</button>
                <button type="submit" className="w-1/2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODALE GESTION BRANCHE */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">{editingCategory ? 'Modifier la Branche' : 'Nouvelle Branche'}</h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Nom de la branche</label><input type="text" value={categoryData.name} onChange={e => setCategoryData({...categoryData, name: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600" required /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Image (URL)</label><input type="url" value={categoryData.imageUrl} onChange={e => setCategoryData({...categoryData, imageUrl: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600" required /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="w-1/2 py-3 bg-slate-100 font-bold rounded-xl hover:bg-slate-200">Annuler</button>
                <button type="submit" className="w-1/2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}