import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function CourseManager() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]); // Nouveau : Liste des étudiants
  const [categories, setCategories] = useState([]); // <-- NOUVEAU : Liste des branches
  // NOUVEAU : Gérer la modale des détails d'un étudiant
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('CONTENT'); // 'CONTENT' ou 'STUDENTS'

  const [newLesson, setNewLesson] = useState({ title: '', content: '', videoUrl: '', order: 1 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null);

  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editCourseData, setEditCourseData] = useState({ title: '', description: '', accessKey: '', imageUrl: '', passingScore: 50 });

  const [managingQuizForLessonId, setManagingQuizForLessonId] = useState(null);
  const [newLessonQ, setNewLessonQ] = useState({ questionText: '', options: ['', '', '', ''], correctAnswer: 0 })

  const [newExamQ, setNewExamQ] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 0
  });
  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourse(response.data);
      if (!editingLessonId) {
        setNewLesson(prev => ({ ...prev, order: response.data.lessons.length + 1 }));
      }
    } catch (error) {
      console.error("Erreur de chargement", error);
      navigate('/instructor');
    }
  };

  // NOUVEAU : Charger les étudiants
  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/courses/${courseId}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error) {
      console.error("Erreur de chargement des étudiants", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCourse();
    fetchStudents();
    fetchCategories(); // <-- NOUVEAU : On charge les branches au démarrage
  }, [courseId]);

  // --- SOUMETTRE UNE QUESTION D'EXAMEN ---
  const handleAddExamQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/courses/${courseId}/exam-questions`, newExamQ, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Question d'examen ajoutée !");
      setNewExamQ({ questionText: '', options: ['', '', '', ''], correctAnswer: 0 });
      fetchCourse(); // Rafraîchit les questions
    } catch (error) {
      alert("Erreur : " + (error.response?.data?.error || error.response?.data?.message || "Erreur serveur"));
    }
  };

  // --- SUPPRIMER UNE QUESTION D'EXAMEN ---
  const handleDeleteExamQuestion = async (questionId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette question ?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/${courseId}/exam-questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourse(); // On rafraîchit la liste des questions !
    } catch (error) {
      alert("Erreur lors de la suppression de la question.");
    }
  };

  // --- GÉRER LES ÉTUDIANTS (SECONDE CHANCE) ---
  const handleResetStudent = async (studentId) => {
    if (!window.confirm("Voulez-vous vraiment effacer la progression de cet étudiant et lui donner une seconde chance ?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/courses/${courseId}/students/${studentId}/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Formation réinitialisée pour l'étudiant !");
      fetchStudents(); // On rafraîchit la liste
    } catch (error) {
      alert("Erreur lors de la réinitialisation.");
    }
  };

  // --- GÉRER LE COURS ENTIER ---
  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/courses/${courseId}`, editCourseData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Formation mise à jour !");
      setIsEditingCourse(false);
      fetchCourse(); 
    } catch (error) {
      alert("Erreur lors de la modification.");
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm("⚠️ DANGER : Êtes-vous sûr de vouloir supprimer TOUTE la formation, ses vidéos et ses étudiants ?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Formation supprimée.");
      navigate('/instructor'); 
    } catch (error) {
      alert("Erreur lors de la suppression.");
    }
  };

  // --- GÉRER LES LEÇONS ---
  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      if (editingLessonId) {
        await axios.put(`http://localhost:5000/api/courses/${courseId}/lessons/${editingLessonId}`, newLesson, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`http://localhost:5000/api/courses/${courseId}/lessons`, newLesson, { headers: { Authorization: `Bearer ${token}` } });
      }
      setEditingLessonId(null);
      setNewLesson({ title: '', content: '', videoUrl: '', order: course.lessons.length + 2 });
      fetchCourse();
    } catch (error) {
      alert("Une erreur est survenue.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setNewLesson({ title: lesson.title, content: lesson.content || '', videoUrl: lesson.videoUrl || '', order: lesson.order });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Supprimer cette leçon ?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/${courseId}/lessons/${lessonId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCourse();
    } catch (error) { alert("Erreur."); }
  };

  // --- GÉRER LES QUESTIONS (QUIZ CHAPITRE) ---
  const handleAddLessonQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/courses/${courseId}/lessons/${managingQuizForLessonId}/questions`, newLessonQ, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewLessonQ({ questionText: '', options: ['', '', '', ''], correctAnswer: 0 });
      fetchCourse(); // Rafraîchit les données pour afficher la nouvelle question
    } catch (error) {
      alert("Erreur lors de l'ajout de la question.");
    }
  };
  
  const handleDeleteLessonQuestion = async (questionId) => {
    if (!window.confirm("Supprimer cette question ?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/${courseId}/lessons/${managingQuizForLessonId}/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourse();
    } catch (error) { alert("Erreur."); }
  };

  // Calculer le temps passé entre l'inscription et l'examen
  const calculateDuration = (start, end) => {
    if (!start) return "N/A";
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date(); // Si pas terminé, on utilise l'heure actuelle
    
    const diffMs = endDate - startDate;
    const diffHrs = Math.floor(diffMs / 36e5);
    const diffMins = Math.round(((diffMs % 36e5) / 60000));
    
    if (diffHrs === 0) return `${diffMins} minutes`;
    return `${diffHrs}h ${diffMins}m`;
  };

  // Forcer le statut de l'étudiant
  const handleOverrideStatus = async (studentId, status) => {
    if (!window.confirm(`Voulez-vous vraiment passer cet étudiant en : ${status === 'VALIDATED' ? 'VALIDÉ' : 'ÉCHEC'} ?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/courses/${courseId}/students/${studentId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Statut mis à jour !");
      setSelectedStudent(null); // On ferme la modale
      fetchStudents(); // On rafraîchit la liste
    } catch (error) {
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  if (!course) return <div className="p-8 text-center">Chargement...</div>;

  // On récupère la leçon complète pour la modale du quiz
  const activeQuizLesson = managingQuizForLessonId ? course.lessons.find(l => l.id === managingQuizForLessonId) : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* En-tête de la page */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link to="/instructor" className="text-blue-600 font-bold hover:underline mb-2 inline-block">
              ← Retour au portail
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Gestion : {course.title}</h1>
            <p className="text-slate-500">Ajoutez des chapitres ou gérez vos étudiants.</p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => {
                setEditCourseData({ 
                  title: course.title, 
                  description: course.description, 
                  accessKey: course.accessKey, 
                  imageUrl: course.imageUrl || '', 
                  passingScore: course.passingScore || 70,
                  categoryId: course.categoryId || '' // <-- NOUVEAU : On récupère la branche actuelle
                });
                setIsEditingCourse(true);
              }}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200"
            >
              ⚙️ Paramètres
            </button>
            <button onClick={handleDeleteCourse} className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200 transition-colors">
              🗑️ Supprimer
            </button>
          </div>
        </div>

        {/* LES ONGLETS (TABS) */}
        <div className="flex gap-6 border-b border-slate-200 mb-8">
          <button 
            onClick={() => setActiveTab('CONTENT')}
            className={`pb-4 px-2 font-bold transition-all ${activeTab === 'CONTENT' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Vidéos & Chapitres
          </button>
          <button 
            onClick={() => setActiveTab('EXAM')}
            className={`pb-4 px-2 font-bold transition-all ${activeTab === 'EXAM' ? 'border-b-4 border-purple-600 text-purple-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Examen Final 🎓
          </button>
          <button 
            onClick={() => setActiveTab('STUDENTS')}
            className={`pb-4 px-2 font-bold transition-all flex items-center gap-2 ${activeTab === 'STUDENTS' ? 'border-b-4 border-blue-600 text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Suivi des Étudiants <span className="bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-xs">{students.length}</span>
          </button>
        </div>

        {/* --- ONGLET 1 : CONTENU DU COURS --- */}
        {activeTab === 'CONTENT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Formulaire Leçon */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-fit sticky top-8">
              <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${editingLessonId ? 'text-amber-600' : 'text-blue-600'}`}>
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-white ${editingLessonId ? 'bg-amber-500' : 'bg-blue-600'}`}>
                  {editingLessonId ? '✎' : '+'}
                </span>
                {editingLessonId ? "Modifier la leçon" : "Nouvelle Leçon"}
              </h2>
              
              <form onSubmit={handleLessonSubmit} className="space-y-4">
                <div><label className="block text-sm font-bold text-slate-700 mb-1">Titre de la leçon</label><input type="text" value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600" required /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1">URL de la vidéo</label><input type="url" value={newLesson.videoUrl} onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600" required /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-1">Description</label><textarea value={newLesson.content} onChange={e => setNewLesson({...newLesson, content: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none h-24 focus:ring-2 focus:ring-blue-600" /></div>
                <div className="flex gap-4">
                  <div className="w-1/3"><label className="block text-sm font-bold text-slate-700 mb-1">Ordre</label><input type="number" min="1" value={newLesson.order} onChange={e => setNewLesson({...newLesson, order: parseInt(e.target.value)})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600" required /></div>
                  <div className="w-2/3 flex items-end"><button type="submit" disabled={isProcessing} className={`w-full py-2 text-white font-bold rounded-xl ${editingLessonId ? 'bg-amber-500' : 'bg-blue-600'}`}>{editingLessonId ? "Mettre à jour" : "Enregistrer"}</button></div>
                </div>
                {editingLessonId && (<button type="button" onClick={() => { setEditingLessonId(null); setNewLesson({ title: '', content: '', videoUrl: '', order: course.lessons.length + 1 }); }} className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 mt-2">Annuler</button>)}
              </form>
            </div>

            {/* Liste Leçons */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-6">Contenu actuel ({course.lessons.length})</h2>
              <div className="space-y-3">
                {course.lessons.length === 0 ? <p className="text-slate-500 italic">Aucune leçon.</p> : course.lessons.map(lesson => (
                  <div key={lesson.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 group hover:border-blue-300">
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">{lesson.order}</div>
                      <div>
                        <h4 className="font-bold text-slate-800 line-clamp-1">{lesson.title}</h4>
                        <p className="text-xs text-blue-600 line-clamp-1 mt-1">{lesson.videoUrl}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => setManagingQuizForLessonId(lesson.id)} className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 font-bold text-xs border border-indigo-200">
                        📝 Quiz ({lesson.questions?.length || 0})
                      </button>
                      <button onClick={() => handleEditLesson(lesson)} className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 font-bold text-xs">Modifier</button>
                      <button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-bold text-xs">Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* ONGLET 2: EXAMEN FINAL (NOUVEAU) */}
        {activeTab === 'EXAM' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 h-fit">
              <h2 className="text-xl font-bold text-purple-600 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 flex items-center justify-center rounded-lg text-white bg-purple-600">+</span>
                Nouvelle Question d'Examen
              </h2>
              <form onSubmit={handleAddExamQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">La Question</label>
                  <input type="text" value={newExamQ.questionText} onChange={e => setNewExamQ({...newExamQ, questionText: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-purple-600" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Les 4 Choix possibles</label>
                  {newExamQ.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <input type="radio" name="correctAns" checked={newExamQ.correctAnswer === i} onChange={() => setNewExamQ({...newExamQ, correctAnswer: i})} className="w-4 h-4 text-purple-600"/>
                      <input type="text" placeholder={`Option ${i+1}`} value={opt} onChange={e => { const newOpts = [...newExamQ.options]; newOpts[i] = e.target.value; setNewExamQ({...newExamQ, options: newOpts}); }} className="w-full px-3 py-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-purple-600" required />
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 mt-1">Cochez le bouton radio de la bonne réponse.</p>
                </div>
                <button type="submit" className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700">Ajouter à l'examen</button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-6">Questions de l'examen ({course.examQuestions?.length || 0})</h2>
              <div className="space-y-4">
                {(!course.examQuestions || course.examQuestions.length === 0) ? (
                  <p className="text-slate-500 italic">Aucune question n'a été ajoutée pour l'examen final.</p>
                ) : (
                  course.examQuestions.map((q, i) => (
                    <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                      
                      {/* LE BOUTON SUPPRIMER (Caché, apparaît au survol) */}
                      <button 
                        onClick={() => handleDeleteExamQuestion(q.id)}
                        className="absolute top-4 right-4 p-2 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 font-bold text-xs"
                        title="Supprimer la question"
                      >
                        🗑️ Supprimer
                      </button>

                      <p className="font-bold text-slate-800 mb-2 pr-20">Q{i+1}. {q.questionText}</p>
                      <ul className="text-sm space-y-1">
                        {q.options.map((opt, optIdx) => (
                          <li key={optIdx} className={`${q.correctAnswer === optIdx ? 'text-green-600 font-bold' : 'text-slate-600'}`}>
                            {q.correctAnswer === optIdx ? '✓ ' : '• '}{opt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- ONGLET 3 : SUIVI DES ÉTUDIANTS --- */}
        {activeTab === 'STUDENTS' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold">Carnet de notes</h2>
              <p className="text-sm text-slate-500">Visualisez les performances et offrez une seconde chance aux étudiants en échec.</p>
            </div>
            
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="px-6 py-4">Étudiant</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Score / Requis</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {students.length === 0 ? (
                  <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Aucun étudiant n'a encore débloqué ce cours.</td></tr>
                ) : (
                  students.map(student => (
                    <tr 
                      key={student.id} 
                      onClick={() => setSelectedStudent(student)} // <-- AJOUTE CECI !
                      className="hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold overflow-hidden">
                          {student.user.avatarUrl ? <img src={student.user.avatarUrl} className="w-full h-full object-cover" alt="avatar"/> : student.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.user.name}</p>
                          <p className="text-xs text-slate-500">{student.user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {student.status === 'IN_PROGRESS' && <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-xs rounded-full">En cours</span>}
                        {student.status === 'VALIDATED' && <span className="px-3 py-1 bg-green-100 text-green-700 font-bold text-xs rounded-full">Validé 🎓</span>}
                        {student.status === 'FAILED' && <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-full">Échec ❌</span>}
                      </td>
                      <td className="px-6 py-4">
                        {student.finalGrade !== null ? (
                          <p className={`font-bold text-lg ${student.status === 'VALIDATED' ? 'text-green-600' : 'text-red-600'}`}>
                            {student.finalGrade} <span className="text-xs text-slate-400 font-normal">/ 20</span>
                          </p>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* BOUTON SECONDE CHANCE : Uniquement si l'étudiant a échoué (ou pour forcer un reset) */}
                        {student.status === 'FAILED' && (
                          <button 
                            onClick={() => handleResetStudent(student.user.id)}
                            className="px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 font-bold text-xs rounded-xl transition-colors"
                          >
                            ↻ Seconde chance (Reset)
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

        {/* ========================================================= */}
      {/* MODALE 1 : GÉRER LE QUIZ D'UNE LEÇON (QUIZ DE CHAPITRE) */}
      {/* ========================================================= */}
      {managingQuizForLessonId && activeQuizLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header de la modale */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-indigo-50 rounded-t-3xl shrink-0">
              <div>
                <h3 className="text-2xl font-bold text-indigo-900">Quiz : {activeQuizLesson.title}</h3>
                <p className="text-indigo-600 text-sm">Gérez les questions pour valider ce chapitre.</p>
              </div>
              <button onClick={() => setManagingQuizForLessonId(null)} className="w-10 h-10 bg-white rounded-full text-slate-500 hover:bg-slate-200 font-bold">X</button>
            </div>

            {/* Contenu de la modale (2 colonnes) */}
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto">
              
              {/* Colonne Gauche : Formulaire ajout QCM Leçon */}
              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm h-fit">
                <h4 className="font-bold text-indigo-600 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-600 text-white rounded-md flex items-center justify-center">+</span> 
                  Ajouter une question
                </h4>
                <form onSubmit={handleAddLessonQuestion} className="space-y-4">
                  <div>
                    <input type="text" placeholder="La question..." value={newLessonQ.questionText} onChange={e => setNewLessonQ({...newLessonQ, questionText: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-600" required />
                  </div>
                  <div>
                    {newLessonQ.options.map((opt, i) => (
                      <div key={i} className="flex gap-2 mb-2 items-center">
                        <input type="radio" name="lessonAns" checked={newLessonQ.correctAnswer === i} onChange={() => setNewLessonQ({...newLessonQ, correctAnswer: i})} className="w-4 h-4 text-indigo-600"/>
                        <input type="text" placeholder={`Option ${i+1}`} value={opt} onChange={e => { const newOpts = [...newLessonQ.options]; newOpts[i] = e.target.value; setNewLessonQ({...newLessonQ, options: newOpts}); }} className="w-full px-3 py-1.5 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-600" required />
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Ajouter</button>
                </form>
              </div>

              {/* Colonne Droite : Liste des questions existantes */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800">Questions actuelles ({activeQuizLesson.questions?.length || 0})</h4>
                {(!activeQuizLesson.questions || activeQuizLesson.questions.length === 0) ? (
                  <p className="text-slate-500 italic p-4 bg-slate-50 rounded-xl">Aucune question pour ce chapitre.</p>
                ) : (
                  activeQuizLesson.questions.map((q, i) => (
                    <div key={q.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                      <button onClick={() => handleDeleteLessonQuestion(q.id)} className="absolute top-4 right-4 p-2 bg-red-100 text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 font-bold text-xs" title="Supprimer">🗑️</button>
                      <p className="font-bold text-slate-800 mb-2 pr-10">Q{i+1}. {q.questionText}</p>
                      <ul className="text-sm space-y-1">
                        {(q.options||[]).map((opt, optIdx) => (
                          <li key={optIdx} className={`${q.correctAnswer === optIdx ? 'text-green-600 font-bold' : 'text-slate-600'}`}>
                            {q.correctAnswer === optIdx ? '✓ ' : '• '}{opt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE PARAMÈTRES DU COURS */}
      {isEditingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-6">Paramètres de la formation</h3>
            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Titre</label><input type="text" value={editCourseData.title} onChange={e => setEditCourseData({...editCourseData, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600" required /></div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Branche (Catégorie)</label>
                <select 
                  value={editCourseData.categoryId} 
                  onChange={(e) => setEditCourseData({...editCourseData, categoryId: e.target.value})}
                  className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">-- Sans branche (Autres) --</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Description</label><textarea value={editCourseData.description} onChange={e => setEditCourseData({...editCourseData, description: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none h-24 focus:ring-2 focus:ring-blue-600" required /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Clé Secrète</label><input type="text" value={editCourseData.accessKey} onChange={e => setEditCourseData({...editCourseData, accessKey: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none font-mono uppercase focus:ring-2 focus:ring-blue-600" required /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Lien Image</label><input type="url" value={editCourseData.imageUrl} onChange={e => setEditCourseData({...editCourseData, imageUrl: e.target.value})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600" /></div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Seuil de validation (%)</label>
                <input type="number" min="0" max="100" value={editCourseData.passingScore} onChange={e => setEditCourseData({...editCourseData, passingScore: parseInt(e.target.value)})} className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-600" required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditingCourse(false)} className="w-1/2 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Annuler</button>
                <button type="submit" className="w-1/2 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE 3 : DÉTAILS ET SUIVI D'UN ÉTUDIANT */}
      {/* ========================================================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl animate-in zoom-in duration-200 flex flex-col">
            
            {/* En-tête */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl overflow-hidden">
                  {selectedStudent.user.avatarUrl ? <img src={selectedStudent.user.avatarUrl} className="w-full h-full object-cover" alt="avatar"/> : selectedStudent.user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedStudent.user.name}</h3>
                  <p className="text-slate-500 text-sm">{selectedStudent.user.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="w-10 h-10 bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-200 font-bold">X</button>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-6">
              
              {/* Statistiques Globales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Date de déblocage</p>
                  <p className="font-bold text-slate-800">{new Date(selectedStudent.createdAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <p className="text-xs font-bold text-purple-500 uppercase tracking-wider mb-1">Examen soumis le</p>
                  <p className="font-bold text-slate-800">
                    {selectedStudent.completedAt ? new Date(selectedStudent.completedAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : "Pas encore soumis"}
                  </p>
                </div>
                <div className="col-span-2 p-4 bg-slate-100 rounded-2xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Temps passé sur la formation</p>
                    <p className="font-black text-xl text-slate-900">{calculateDuration(selectedStudent.createdAt, selectedStudent.completedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Note Finale</p>
                    <p className={`font-black text-2xl ${selectedStudent.status === 'VALIDATED' ? 'text-green-600' : selectedStudent.status === 'FAILED' ? 'text-red-600' : 'text-slate-900'}`}>
                      {selectedStudent.finalGrade !== null ? `${selectedStudent.finalGrade}/20` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Détails par leçon */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3">Détail des chapitres (Quiz)</h4>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100">
                  {(!selectedStudent.user.lessonProgresses || selectedStudent.user.lessonProgresses.length === 0) ? (
                    <p className="p-4 text-slate-500 text-sm italic">Aucun chapitre terminé.</p>
                  ) : (
                    selectedStudent.user.lessonProgresses.map((progress, idx) => (
                      <div key={idx} className="p-3 flex justify-between items-center bg-white hover:bg-slate-50">
                        <p className="text-sm font-medium text-slate-700">
                          {progress.lesson.order}. {progress.lesson.title}
                        </p>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${(progress.score ?? 20) >= 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          Score : {progress.score ?? 20} / 20
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Score Examen */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-slate-700">Note Examen Final (70%) :</span>
                <span className="font-black text-lg">{selectedStudent.examScore !== null ? `${selectedStudent.examScore}/20` : 'Non passé'}</span>
              </div>
              
            </div>

            {/* Actions Administratives (Forcer le statut) */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-3xl flex gap-4">
              <button 
                onClick={() => handleOverrideStatus(selectedStudent.user.id, 'FAILED')}
                className="w-1/2 py-3 bg-white border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors"
              >
                Non Valider ❌
              </button>
              <button 
                onClick={() => handleOverrideStatus(selectedStudent.user.id, 'VALIDATED')}
                className="w-1/2 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
              >
                Valider 🎓
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}