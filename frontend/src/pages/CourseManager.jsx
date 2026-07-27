import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function CourseManager() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [newLesson, setNewLesson] = useState({ title: '', content: '', videoUrl: '', order: 1 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null);

  // --- ÉTATS POUR LE COURS ENTIER ---
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editCourseData, setEditCourseData] = useState({ title: '', description: '', accessKey: '', imageUrl: '' });

  // --- ÉTATS POUR LE QUIZ ---
  const [questionData, setQuestionData] = useState({ questionText: '', opt1: '', opt2: '', opt3: '', correctAnswer: '0' });

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('token');
      // On utilise import.meta.env.VITE_API_URL pour pointer vers Railway ou localhost
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.get(`${apiUrl}/courses/${courseId}`, {
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

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  // --- CRUD LEÇONS ---
  const handleSubmitLesson = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      if (editingLessonId) {
        await axios.put(`${apiUrl}/courses/${courseId}/lessons/${editingLessonId}`, newLesson, { headers: { Authorization: `Bearer ${token}` } });
        alert("Leçon modifiée !");
      } else {
        await axios.post(`${apiUrl}/courses/${courseId}/lessons`, newLesson, { headers: { Authorization: `Bearer ${token}` } });
        alert("Leçon ajoutée !");
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

  const handleEditClick = (lesson) => {
    setEditingLessonId(lesson.id);
    setNewLesson({ title: lesson.title, content: lesson.content || '', videoUrl: lesson.videoUrl || '', order: lesson.order });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (lessonId) => {
    if (!window.confirm("Supprimer cette leçon ?")) return;
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.delete(`${apiUrl}/courses/${courseId}/lessons/${lessonId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCourse();
    } catch (error) {
      alert("Erreur lors de la suppression.");
    }
  };

  // --- CRUD COURS ENTIER ---
  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.put(`${apiUrl}/courses/${courseId}`, editCourseData, { headers: { Authorization: `Bearer ${token}` } });
      alert("Formation mise à jour !");
      setIsEditingCourse(false);
      fetchCourse();
    } catch (error) {
      alert("Erreur lors de la modification.");
    }
  };

  const handleDeleteCourse = async () => {
    if (!window.confirm("⚠️ DANGER : Supprimer TOUTE la formation ?")) return;
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.delete(`${apiUrl}/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } });
      navigate('/instructor');
    } catch (error) {
      alert("Erreur lors de la suppression.");
    }
  };

  // --- CRUD QUIZ ---
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      // On groupe les options dans un tableau en enlevant les cases vides
      const options = [questionData.opt1, questionData.opt2, questionData.opt3].filter(o => o.trim() !== '');
      
      if(options.length < 2) return alert("Il faut au moins 2 choix de réponses !");

      await axios.post(`${apiUrl}/courses/${courseId}/lessons/${editingLessonId}/questions`, {
        questionText: questionData.questionText,
        options: options,
        correctAnswer: parseInt(questionData.correctAnswer)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert("Question ajoutée au Quiz !");
      setQuestionData({ questionText: '', opt1: '', opt2: '', opt3: '', correctAnswer: '0' });
      fetchCourse();
    } catch (error) {
      console.error(error);
      alert("Erreur : " + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if(!window.confirm("Supprimer cette question ?")) return;
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      await axios.delete(`${apiUrl}/courses/${courseId}/lessons/${editingLessonId}/questions/${questionId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCourse();
    } catch (error) {
      console.error(error);
      alert("Erreur : " + (error.response?.data?.message || error.message));
    }
  };

  if (!course) return <div className="p-8 text-center font-bold">Chargement...</div>;

  // On récupère la leçon en cours d'édition pour afficher ses questions
  const currentEditingLesson = editingLessonId ? course.lessons.find(l => l.id === editingLessonId) : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* EN-TÊTE DU COURS */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link to="/instructor" className="text-blue-600 font-bold hover:underline mb-2 inline-block">
              ← Retour au portail
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Gestion : {course.title}</h1>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => {
                setEditCourseData({ title: course.title, description: course.description, accessKey: course.accessKey, imageUrl: course.imageUrl || '' });
                setIsEditingCourse(true);
              }}
              className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-300">
              ⚙️ Paramètres
            </button>
            <button onClick={handleDeleteCourse} className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200">
              🗑️ Supprimer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLONNE GAUCHE : FORMULAIRES (Leçon + Quiz) */}
          <div className="lg:col-span-6 space-y-6 sticky top-8">
            
            {/* 1. FORMULAIRE LEÇON */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 ${editingLessonId ? 'text-amber-600' : 'text-blue-600'}`}>
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-white ${editingLessonId ? 'bg-amber-500' : 'bg-blue-600'}`}>
                  {editingLessonId ? '✎' : '+'}
                </span>
                {editingLessonId ? "Modifier la leçon" : "Nouvelle Leçon"}
              </h2>
              
              <form onSubmit={handleSubmitLesson} className="space-y-4">
                <input type="text" value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} placeholder="Titre de la leçon" className="w-full px-4 py-2 border rounded-xl" required />
                <input type="url" value={newLesson.videoUrl} onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})} placeholder="URL de la vidéo (YouTube ou mp4)" className="w-full px-4 py-2 border rounded-xl" required />
                <textarea value={newLesson.content} onChange={e => setNewLesson({...newLesson, content: e.target.value})} placeholder="Description / Contenu texte" className="w-full px-4 py-2 border rounded-xl h-24" />
                <div className="flex gap-4">
                  <input type="number" value={newLesson.order} onChange={e => setNewLesson({...newLesson, order: parseInt(e.target.value)})} className="w-1/3 px-4 py-2 border rounded-xl" required placeholder="Ordre" />
                  <button type="submit" disabled={isProcessing} className={`w-2/3 py-2 text-white font-bold rounded-xl ${editingLessonId ? 'bg-amber-500' : 'bg-blue-600'}`}>
                    {editingLessonId ? "Mettre à jour" : "Enregistrer"}
                  </button>
                </div>
                {editingLessonId && (
                  <button type="button" onClick={() => { setEditingLessonId(null); setNewLesson({ title: '', content: '', videoUrl: '', order: course.lessons.length + 1 }); }} className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-xl mt-2">
                    Annuler la modification
                  </button>
                )}
              </form>
            </div>

            {/* 2. FORMULAIRE QUIZ (Visible uniquement si on modifie une leçon) */}
            {editingLessonId && currentEditingLesson && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-purple-200">
                <h2 className="text-xl font-bold text-purple-600 mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 flex items-center justify-center rounded-lg text-white bg-purple-600">?</span>
                  Ajouter un Quiz à cette leçon
                </h2>
                <form onSubmit={handleAddQuestion} className="space-y-3">
                  <input type="text" value={questionData.questionText} onChange={e => setQuestionData({...questionData, questionText: e.target.value})} placeholder="Votre question..." className="w-full px-4 py-2 border border-purple-100 rounded-xl bg-purple-50 focus:ring-purple-500 outline-none" required />
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" value={questionData.opt1} onChange={e => setQuestionData({...questionData, opt1: e.target.value})} placeholder="Choix 1" className="w-full px-3 py-2 border text-sm rounded-lg" required />
                    <input type="text" value={questionData.opt2} onChange={e => setQuestionData({...questionData, opt2: e.target.value})} placeholder="Choix 2" className="w-full px-3 py-2 border text-sm rounded-lg" required />
                    <input type="text" value={questionData.opt3} onChange={e => setQuestionData({...questionData, opt3: e.target.value})} placeholder="Choix 3 (optionnel)" className="w-full px-3 py-2 border text-sm rounded-lg" />
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="text-sm font-bold text-slate-600 shrink-0">Bonne réponse :</label>
                    <select value={questionData.correctAnswer} onChange={e => setQuestionData({...questionData, correctAnswer: e.target.value})} className="border px-4 py-2 rounded-xl bg-white focus:ring-purple-500 outline-none w-full">
                      <option value="0">Choix 1</option>
                      <option value="1">Choix 2</option>
                      {questionData.opt3.trim() !== '' && <option value="2">Choix 3</option>}
                    </select>
                  </div>
                  <button type="submit" className="w-full py-3 mt-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors">
                    + Ajouter la question
                  </button>
                </form>

                {/* Liste des questions de cette leçon */}
                {currentEditingLesson.questions?.length > 0 && (
                  <div className="mt-6 space-y-3 border-t pt-6">
                    <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wider mb-3">Questions du Quiz ({currentEditingLesson.questions.length})</h4>
                    {currentEditingLesson.questions.map((q, i) => (
                      <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-start">
                        <div>
                          <p className="font-bold text-sm">Q{i+1}. {q.questionText}</p>
                          <p className="text-xs text-green-600 font-bold mt-1">✓ {q.options[q.correctAnswer]}</p>
                        </div>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700 text-xs font-bold">Supprimer</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COLONNE DROITE : LISTE DES LEÇONS */}
          <div className="lg:col-span-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-6">Contenu actuel ({course.lessons.length})</h2>
            
            <div className="space-y-3">
              {course.lessons.length === 0 ? (
                <p className="text-slate-500 italic">Aucune leçon pour le moment.</p>
              ) : (
                course.lessons.map(lesson => (
                  <div key={lesson.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 group hover:border-blue-300 transition-colors">
                    
                    <div className="flex items-start gap-3 overflow-hidden">
                      <div className="w-8 h-8 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                        {lesson.order}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 line-clamp-1">
                          {lesson.title}
                          {/* Petit badge si la leçon a un quiz */}
                          {lesson.questions?.length > 0 && (
                            <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Quiz ({lesson.questions.length})</span>
                          )}
                        </h4>
                        <p className="text-xs text-blue-600 line-clamp-1 mt-1">{lesson.videoUrl}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => handleEditClick(lesson)} className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 font-bold text-xs">
                        Modifier / Quiz
                      </button>
                      <button onClick={() => handleDeleteClick(lesson.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-bold text-xs">
                        Suppr.
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* MODALE DE PARAMÈTRES DU COURS (Garde ton code existant ici pour isEditingCourse) */}
      {isEditingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-6">Paramètres de la formation</h3>
            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <div><label className="block text-sm font-bold mb-1">Titre</label><input type="text" value={editCourseData.title} onChange={e => setEditCourseData({...editCourseData, title: e.target.value})} className="w-full px-4 py-2 border rounded-xl" required /></div>
              <div><label className="block text-sm font-bold mb-1">Description</label><textarea value={editCourseData.description} onChange={e => setEditCourseData({...editCourseData, description: e.target.value})} className="w-full px-4 py-2 border rounded-xl h-24" required /></div>
              <div><label className="block text-sm font-bold mb-1">Clé Secrète</label><input type="text" value={editCourseData.accessKey} onChange={e => setEditCourseData({...editCourseData, accessKey: e.target.value})} className="w-full px-4 py-2 border rounded-xl uppercase" required /></div>
              <div><label className="block text-sm font-bold mb-1">Image (URL)</label><input type="url" value={editCourseData.imageUrl} onChange={e => setEditCourseData({...editCourseData, imageUrl: e.target.value})} className="w-full px-4 py-2 border rounded-xl" /></div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditingCourse(false)} className="w-1/2 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="w-1/2 py-3 bg-blue-600 text-white font-bold rounded-xl">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}