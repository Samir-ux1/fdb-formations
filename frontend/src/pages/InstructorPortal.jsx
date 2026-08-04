import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function InstructorPortal() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  
  // États pour la création d'un nouveau cours
  const [isCreating, setIsCreating] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', accessKey: '', imageUrl: '' });

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
      setCourses(response.data);
    } catch (error) {
      console.error("Erreur de récupération des cours", error);
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
      setNewCourse({ title: '', description: '', accessKey: '' });
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
          <div className="flex items-center gap-3 py-3 px-4 bg-blue-600 text-white rounded-xl shadow-lg">
            <span className="font-medium text-sm">Mes Formations</span>
          </div>
        </nav>

        <div className="mt-auto px-4">
          <button 
            onClick={() => setIsCreating(true)}
            className="w-full py-4 bg-white text-slate-900 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-100 transition-all"
          >
            + Créer une formation
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="md:ml-64 flex-1 pb-12">
        

        <div className="p-8 max-w-6xl mx-auto space-y-8">
          
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Vos Formations</h2>
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
        </div>
      </main>

      {/* MODALE CRÉATION DE COURS */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-6">Nouvelle Formation</h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
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

    </div>
  );
}