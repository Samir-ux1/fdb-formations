import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Settings, Trash2, BookOpen, GraduationCap, Users, Plus, Edit,
  PlaySquare, FileText, CheckCircle2, XCircle, Clock, RotateCcw, Target,
  ClipboardList, HelpCircle, UserCheck, UserX, X, LayoutTemplate, Tag, AlignLeft,
  KeyRound, Image as ImageIcon
} from 'lucide-react';

export default function CourseManager() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]); 
  const [categories, setCategories] = useState([]); 
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('CONTENT'); // 'CONTENT', 'EXAM', 'STUDENTS'

  const [newLesson, setNewLesson] = useState({ title: '', content: '', videoUrl: '', pdfUrl: '', order: 1 });
  const [lessonType, setLessonType] = useState('VIDEO'); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null);

  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editCourseData, setEditCourseData] = useState({ title: '', description: '', accessKey: '', imageUrl: '', passingScore: 50 });

  const [managingQuizForLessonId, setManagingQuizForLessonId] = useState(null);
  const [newLessonQ, setNewLessonQ] = useState({ questionText: '', options: ['', '', '', ''], correctAnswer: 0 });

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
    fetchCategories(); 
  }, [courseId]);

  // --- ACTIONS EXAMEN ---
  const handleAddExamQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/courses/${courseId}/exam-questions`, newExamQ, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Question d'examen ajoutée !");
      setNewExamQ({ questionText: '', options: ['', '', '', ''], correctAnswer: 0 });
      fetchCourse(); 
    } catch (error) {
      alert("Erreur : " + (error.response?.data?.error || error.response?.data?.message || "Erreur serveur"));
    }
  };

  const handleDeleteExamQuestion = async (questionId) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette question ?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/${courseId}/exam-questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourse(); 
    } catch (error) {
      alert("Erreur lors de la suppression de la question.");
    }
  };

  // --- ACTIONS ÉTUDIANTS ---
  const handleResetStudent = async (studentId) => {
    if (!window.confirm("Voulez-vous vraiment effacer la progression de cet étudiant et lui donner une seconde chance ?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/courses/${courseId}/students/${studentId}/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Formation réinitialisée pour l'étudiant !");
      fetchStudents(); 
    } catch (error) {
      alert("Erreur lors de la réinitialisation.");
    }
  };

  const handleOverrideStatus = async (studentId, status) => {
    if (!window.confirm(`Voulez-vous vraiment passer cet étudiant en : ${status === 'VALIDATED' ? 'VALIDÉ' : 'ÉCHEC'} ?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/courses/${courseId}/students/${studentId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Statut mis à jour !");
      setSelectedStudent(null); 
      fetchStudents(); 
    } catch (error) {
      alert("Erreur lors de la mise à jour du statut.");
    }
  };

  // --- ACTIONS COURS & LEÇONS ---
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

  const handleLessonSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    const dataToSend = {
      title: newLesson.title,
      content: newLesson.content,
      order: newLesson.order,
      videoUrl: lessonType === 'VIDEO' ? newLesson.videoUrl : null,
      pdfUrl: lessonType === 'PDF' ? newLesson.pdfUrl : null,
    };

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingLessonId) {
        await axios.put(`http://localhost:5000/api/courses/${courseId}/lessons/${editingLessonId}`, dataToSend, config);
      } else {
        await axios.post(`http://localhost:5000/api/courses/${courseId}/lessons`, dataToSend, config);
      }
      
      setEditingLessonId(null);
      setNewLesson({ title: '', content: '', videoUrl: '', pdfUrl: '', order: course.lessons.length + 2 });
      fetchCourse();
      alert("Chapitre sauvegardé avec succès !");
    } catch (error) {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditLesson = (lesson) => {
    setEditingLessonId(lesson.id);
    setLessonType(lesson.pdfUrl ? 'PDF' : 'VIDEO');
    setNewLesson({ title: lesson.title, content: lesson.content || '', videoUrl: lesson.videoUrl || '', pdfUrl: lesson.pdfUrl || '', order: lesson.order });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("Supprimer ce chapitre ?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/courses/${courseId}/lessons/${lessonId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCourse();
    } catch (error) { alert("Erreur."); }
  };

  // --- ACTIONS QUIZ CHAPITRE ---
  const handleAddLessonQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/courses/${courseId}/lessons/${managingQuizForLessonId}/questions`, newLessonQ, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewLessonQ({ questionText: '', options: ['', '', '', ''], correctAnswer: 0 });
      fetchCourse(); 
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

  const calculateDuration = (start, end) => {
    if (!start) return "N/A";
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date(); 
    
    const diffMs = endDate - startDate;
    const diffHrs = Math.floor(diffMs / 36e5);
    const diffMins = Math.round(((diffMs % 36e5) / 60000));
    
    if (diffHrs === 0) return `${diffMins} minutes`;
    return `${diffHrs}h ${diffMins}m`;
  };

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-[#EB0A1E] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const activeQuizLesson = managingQuizForLessonId ? course.lessons.find(l => l.id === managingQuizForLessonId) : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      
      {/* EN-TÊTE PAGE */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/instructor" className="text-slate-500 font-bold hover:text-[#EB0A1E] text-xs uppercase tracking-wider mb-2 flex items-center gap-1 w-fit transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour au Portail Formateur
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{course.title}</h1>
              <p className="text-slate-500 text-sm mt-1">Administration de la formation et suivi des effectifs.</p>
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
                    categoryId: course.categoryId || '' 
                  });
                  setIsEditingCourse(true);
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 flex items-center gap-2 transition-colors"
              >
                <Settings className="w-4 h-4" /> Paramètres
              </button>
              <button 
                onClick={handleDeleteCourse} 
                className="px-4 py-2 bg-red-50 text-[#EB0A1E] text-xs font-black uppercase tracking-wider rounded-xl hover:bg-red-100 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </div>
        
        {/* TABS (ONGLETS) */}
        <div className="max-w-7xl mx-auto px-6 mt-4">
          <div className="flex gap-6 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('CONTENT')}
              className={`pb-3 px-1 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${activeTab === 'CONTENT' ? 'border-[#EB0A1E] text-[#EB0A1E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <BookOpen className="w-4 h-4" /> Chapitres
            </button>
            <button 
              onClick={() => setActiveTab('EXAM')}
              className={`pb-3 px-1 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${activeTab === 'EXAM' ? 'border-[#111827] text-[#111827]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <Target className="w-4 h-4" /> Examen Final
            </button>
            <button 
              onClick={() => setActiveTab('STUDENTS')}
              className={`pb-3 px-1 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ${activeTab === 'STUDENTS' ? 'border-[#EB0A1E] text-[#EB0A1E]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <Users className="w-4 h-4" /> Effectif 
              <span className={`py-0.5 px-2 rounded-full text-[10px] ${activeTab === 'STUDENTS' ? 'bg-[#EB0A1E] text-white' : 'bg-slate-100 text-slate-600'}`}>
                {students.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* --- ONGLET 1 : CONTENU DU COURS --- */}
        {activeTab === 'CONTENT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Formulaire Leçon */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 h-fit sticky top-48">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${editingLessonId ? 'bg-amber-100 text-amber-600' : 'bg-red-50 text-[#EB0A1E]'}`}>
                  {editingLessonId ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  {editingLessonId ? "Modifier le chapitre" : "Nouveau Chapitre"}
                </h2>
              </div>
              
              <form onSubmit={handleLessonSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Titre du chapitre</label>
                  <input type="text" value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm transition-all" placeholder="Ex: Introduction aux normes" required />
                </div>
                
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Type de support</label>
                  <div className="flex gap-4">
                    <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer text-sm font-bold p-3 rounded-xl border-2 transition-all ${lessonType === 'VIDEO' ? 'border-[#EB0A1E] bg-red-50 text-[#EB0A1E]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <input type="radio" checked={lessonType === 'VIDEO'} onChange={() => { setLessonType('VIDEO'); setNewLesson({...newLesson, pdfUrl: ''}) }} className="hidden" />
                      <PlaySquare className="w-4 h-4" /> Vidéo
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer text-sm font-bold p-3 rounded-xl border-2 transition-all ${lessonType === 'PDF' ? 'border-[#EB0A1E] bg-red-50 text-[#EB0A1E]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <input type="radio" checked={lessonType === 'PDF'} onChange={() => { setLessonType('PDF'); setNewLesson({...newLesson, videoUrl: ''}) }} className="hidden" />
                      <FileText className="w-4 h-4" /> Doc PDF
                    </label>
                  </div>
                </div>

                {lessonType === 'VIDEO' ? (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">URL de la vidéo (YouTube / MP4)</label>
                    <input type="url" value={newLesson.videoUrl || ''} onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})} placeholder="https://..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm transition-all" required={lessonType === 'VIDEO'} />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Lien de partage Drive / PDF</label>
                    <input type="url" value={newLesson.pdfUrl || ''} onChange={e => setNewLesson({...newLesson, pdfUrl: e.target.value})} placeholder="https://drive.google.com/..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm transition-all" required={lessonType === 'PDF'} />
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Description (Optionnelle)</label>
                  <textarea value={newLesson.content} onChange={e => setNewLesson({...newLesson, content: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none h-24 resize-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm transition-all" />
                </div>
                
                <div className="flex gap-4">
                  <div className="w-1/3">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">Ordre</label>
                    <input type="number" min="1" value={newLesson.order} onChange={e => setNewLesson({...newLesson, order: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-center font-bold focus:border-slate-800 focus:ring-2 focus:ring-slate-200 transition-all text-sm" required />
                  </div>
                  <div className="w-2/3 flex items-end">
                    <button type="submit" disabled={isProcessing} className={`w-full py-3.5 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${editingLessonId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#111827] hover:bg-[#EB0A1E]'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                      {editingLessonId ? "Mettre à jour" : "Sauvegarder"}
                    </button>
                  </div>
                </div>
                {editingLessonId && (
                  <button type="button" onClick={() => { setEditingLessonId(null); setNewLesson({ title: '', content: '', videoUrl: '', pdfUrl: '', order: course.lessons.length + 1 }); }} className="w-full py-3 bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors mt-2">
                    Annuler la modification
                  </button>
                )}
              </form>
            </div>

            {/* Liste Leçons */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-black text-slate-900 mb-6">Contenu structuré ({course.lessons.length})</h2>
              <div className="space-y-4">
                {course.lessons.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                    <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold">Aucun chapitre n'a été ajouté.</p>
                  </div>
                ) : course.lessons.map(lesson => (
                  <div key={lesson.id} className="p-4 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-[#EB0A1E] transition-all">
                    <div className="flex items-start gap-4 overflow-hidden">
                      <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
                        {lesson.order}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 line-clamp-1 text-base">{lesson.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {lesson.videoUrl ? (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                              <PlaySquare className="w-3 h-3" /> Vidéo
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-wider rounded-md flex items-center gap-1">
                              <FileText className="w-3 h-3" /> PDF
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {lesson.questions?.length > 0 ? `${lesson.questions.length} questions` : 'Pas de quiz'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                      <button onClick={() => setManagingQuizForLessonId(lesson.id)} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors">
                        <HelpCircle className="w-3.5 h-3.5" /> Quiz
                      </button>
                      <button onClick={() => handleEditLesson(lesson)} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 font-bold transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteLesson(lesson.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- ONGLET 2: EXAMEN FINAL --- */}
        {activeTab === 'EXAM' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-[#111827] p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 h-fit text-white sticky top-48">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-white">Créer une question</h2>
              </div>
              <form onSubmit={handleAddExamQuestion} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">Intitulé de la question</label>
                  <input type="text" value={newExamQ.questionText} onChange={e => setNewExamQ({...newExamQ, questionText: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border-none rounded-xl outline-none text-white focus:ring-2 focus:ring-slate-500 text-sm transition-all" placeholder="Ex: Que signifie TPS ?" required />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Options & Bonne Réponse</label>
                  {newExamQ.options.map((opt, i) => (
                    <div key={i} className="flex gap-3 mb-3 items-center">
                      <div className="relative flex items-center">
                        <input type="radio" name="correctAns" checked={newExamQ.correctAnswer === i} onChange={() => setNewExamQ({...newExamQ, correctAnswer: i})} className="w-5 h-5 accent-[#EB0A1E] cursor-pointer"/>
                      </div>
                      <input type="text" placeholder={`Option ${i+1}`} value={opt} onChange={e => { const newOpts = [...newExamQ.options]; newOpts[i] = e.target.value; setNewExamQ({...newExamQ, options: newOpts}); }} className={`w-full px-4 py-2 bg-slate-800 border-none rounded-lg outline-none text-white text-sm transition-all ${newExamQ.correctAnswer === i ? 'ring-1 ring-[#EB0A1E]' : 'focus:ring-1 focus:ring-slate-500'}`} required />
                    </div>
                  ))}
                  <p className="text-[10px] text-slate-500 uppercase font-bold mt-2">Cochez le bouton de la bonne réponse.</p>
                </div>
                <button type="submit" className="w-full py-3.5 bg-[#EB0A1E] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#BD0014] transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 mt-4">
                  <Plus className="w-4 h-4" /> Ajouter à l'examen
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-black text-slate-900 mb-6">Base de questions ({course.examQuestions?.length || 0})</h2>
              <div className="space-y-4">
                {(!course.examQuestions || course.examQuestions.length === 0) ? (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                    <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold">L'examen final ne contient aucune question.</p>
                  </div>
                ) : (
                  course.examQuestions.map((q, i) => (
                    <div key={q.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl relative group hover:border-slate-300 transition-colors">
                      <button 
                        onClick={() => handleDeleteExamQuestion(q.id)}
                        className="absolute top-4 right-4 p-2 bg-white text-slate-400 border border-slate-200 rounded-lg sm:opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200 font-bold"
                        title="Supprimer la question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <p className="font-bold text-slate-900 mb-3 pr-12 text-base flex items-start gap-2">
                        <span className="text-slate-400">Q{i+1}.</span> {q.questionText}
                      </p>
                      <ul className="text-sm space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <li key={optIdx} className={`flex items-start gap-2 p-2 rounded-lg border ${q.correctAnswer === optIdx ? 'bg-emerald-50 border-emerald-100 text-emerald-700 font-bold' : 'border-transparent text-slate-600'}`}>
                            {q.correctAnswer === optIdx ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 mt-0.5 shrink-0"></div>}
                            <span>{opt}</span>
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
            <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Registre des Évaluations</h2>
                <p className="text-sm text-slate-500 mt-1">Cliquez sur un collaborateur pour analyser ses performances et gérer ses accès.</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-white border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500 font-black">
                  <tr>
                    <th className="px-6 py-4">Collaborateur</th>
                    <th className="px-6 py-4">Statut de Validation</th>
                    <th className="px-6 py-4">Score Examen</th>
                    <th className="px-6 py-4 text-right">Actions Rapides</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 font-bold">Aucun collaborateur n'a activé cette clé.</p>
                      </td>
                    </tr>
                  ) : (
                    students.map(student => (
                      <tr 
                        key={student.id} 
                        onClick={() => setSelectedStudent(student)} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black overflow-hidden shadow-sm">
                            {student.user.avatarUrl ? <img src={student.user.avatarUrl} className="w-full h-full object-cover" alt="avatar"/> : student.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{student.user.name}</p>
                            <p className="text-xs text-slate-500">{student.user.email || 'Pas d\'email'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {student.status === 'IN_PROGRESS' && <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider rounded-md border border-slate-200 flex items-center gap-1.5 w-max"><Clock className="w-3.5 h-3.5" /> En formation</span>}
                          {student.status === 'VALIDATED' && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase tracking-wider rounded-md border border-emerald-100 flex items-center gap-1.5 w-max"><CheckCircle2 className="w-3.5 h-3.5" /> Validé</span>}
                          {student.status === 'FAILED' && <span className="px-3 py-1 bg-red-50 text-red-600 font-bold text-[10px] uppercase tracking-wider rounded-md border border-red-100 flex items-center gap-1.5 w-max"><XCircle className="w-3.5 h-3.5" /> Non validé</span>}
                        </td>
                        <td className="px-6 py-4">
                          {student.finalGrade !== null ? (
                            <p className={`font-black text-base ${student.status === 'VALIDATED' ? 'text-emerald-600' : 'text-red-600'}`}>
                              {student.finalGrade} <span className="text-[10px] text-slate-400 font-bold">/ 20</span>
                            </p>
                          ) : (
                            <span className="text-slate-400 font-semibold text-xs">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {student.status === 'FAILED' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleResetStudent(student.user.id); }}
                              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 ml-auto shadow-sm"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Reset (2ème chance)
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODALE 1 : GÉRER LE QUIZ D'UNE LEÇON (QUIZ DE CHAPITRE) */}
      {/* ========================================================= */}
      {managingQuizForLessonId && activeQuizLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#111827] rounded-t-3xl"></div>
            
            <div className="p-6 sm:p-8 border-b border-slate-200 flex justify-between items-start shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-[#EB0A1E]" />
                  Quiz : {activeQuizLesson.title}
                </h3>
                <p className="text-slate-500 text-sm mt-1">Gérez les questions pour valider la compréhension de ce chapitre.</p>
              </div>
              <button onClick={() => setManagingQuizForLessonId(null)} className="w-10 h-10 bg-slate-100 rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-900 flex items-center justify-center transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto bg-slate-50 rounded-b-3xl">
              
              {/* Formulaire ajout QCM Leçon */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
                <h4 className="font-black text-slate-900 mb-5 flex items-center gap-2 text-lg">
                  Nouveau QCM
                </h4>
                <form onSubmit={handleAddLessonQuestion} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Intitulé</label>
                    <input type="text" placeholder="La question..." value={newLessonQ.questionText} onChange={e => setNewLessonQ({...newLessonQ, questionText: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm font-semibold transition-all" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Options & Réponse</label>
                    {newLessonQ.options.map((opt, i) => (
                      <div key={i} className="flex gap-2 mb-2 items-center">
                        <input type="radio" name="lessonAns" checked={newLessonQ.correctAnswer === i} onChange={() => setNewLessonQ({...newLessonQ, correctAnswer: i})} className="w-4 h-4 accent-[#EB0A1E] cursor-pointer shrink-0"/>
                        <input type="text" placeholder={`Option ${i+1}`} value={opt} onChange={e => { const newOpts = [...newLessonQ.options]; newOpts[i] = e.target.value; setNewLessonQ({...newLessonQ, options: newOpts}); }} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm transition-all" required />
                      </div>
                    ))}
                  </div>
                  <button type="submit" className="w-full py-3 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#EB0A1E] transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 mt-2">
                    <Plus className="w-4 h-4" /> Ajouter
                  </button>
                </form>
              </div>

              {/* Liste des questions existantes */}
              <div className="space-y-4">
                <h4 className="font-black text-slate-900 text-lg">Questions actuelles ({activeQuizLesson.questions?.length || 0})</h4>
                {(!activeQuizLesson.questions || activeQuizLesson.questions.length === 0) ? (
                  <p className="text-slate-500 italic p-6 bg-white border border-slate-200 rounded-2xl text-center font-semibold text-sm">Aucune question pour ce chapitre.</p>
                ) : (
                  activeQuizLesson.questions.map((q, i) => (
                    <div key={q.id} className="p-5 bg-white border border-slate-200 rounded-2xl relative group shadow-sm">
                      <button onClick={() => handleDeleteLessonQuestion(q.id)} className="absolute top-4 right-4 p-2 bg-white border border-slate-200 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-100" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <p className="font-bold text-slate-900 mb-3 pr-10 text-sm flex items-start gap-1.5"><span className="text-slate-400 shrink-0">Q{i+1}.</span> {q.questionText}</p>
                      <ul className="text-sm space-y-2">
                        {(q.options||[]).map((opt, optIdx) => (
                          <li key={optIdx} className={`flex items-start gap-2 p-1.5 rounded-lg border ${q.correctAnswer === optIdx ? 'bg-emerald-50 border-emerald-100 text-emerald-700 font-bold' : 'border-transparent text-slate-600'}`}>
                            {q.correctAnswer === optIdx ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <div className="w-4 h-4 shrink-0 rounded-full border border-slate-300 mt-0.5"></div>}
                            <span>{opt}</span>
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

      {/* MODALE 2 : PARAMÈTRES DU COURS */}
      {isEditingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-[#111827] rounded-t-3xl"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Paramètres</h3>
            </div>

            <form onSubmit={handleUpdateCourse} className="space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5"><Tag className="w-3.5 h-3.5"/> Titre</label>
                <input type="text" value={editCourseData.title} onChange={e => setEditCourseData({...editCourseData, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm font-semibold transition-all" required />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5"><LayoutTemplate className="w-3.5 h-3.5"/> Filière</label>
                <select value={editCourseData.categoryId} onChange={(e) => setEditCourseData({...editCourseData, categoryId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm transition-all">
                  <option value="">-- Mode Transversal (Sans Filière) --</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5"><AlignLeft className="w-3.5 h-3.5"/> Description</label>
                <textarea value={editCourseData.description} onChange={e => setEditCourseData({...editCourseData, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none h-20 resize-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm transition-all" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5"><KeyRound className="w-3.5 h-3.5"/> Clé</label>
                  <input type="text" value={editCourseData.accessKey} onChange={e => setEditCourseData({...editCourseData, accessKey: e.target.value.toUpperCase()})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono uppercase text-center font-bold focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm transition-all" required />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5"><Target className="w-3.5 h-3.5"/> Seuil (%)</label>
                  <input type="number" min="0" max="100" value={editCourseData.passingScore} onChange={e => setEditCourseData({...editCourseData, passingScore: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-center font-bold focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm transition-all" required />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5"><ImageIcon className="w-3.5 h-3.5"/> Lien Image</label>
                <input type="url" value={editCourseData.imageUrl} onChange={e => setEditCourseData({...editCourseData, imageUrl: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-800 focus:ring-2 focus:ring-slate-200 text-sm transition-all" />
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => setIsEditingCourse(false)} className="w-1/3 py-3.5 bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit" className="w-2/3 py-3.5 bg-[#EB0A1E] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#BD0014] shadow-md transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALE 3 : DÉTAILS ET SUIVI D'UN ÉTUDIANT */}
      {/* ========================================================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col relative overflow-hidden">
            
            {/* Décoration Header */}
            <div className={`absolute top-0 left-0 w-full h-3 ${selectedStudent.status === 'VALIDATED' ? 'bg-emerald-500' : selectedStudent.status === 'FAILED' ? 'bg-red-500' : 'bg-slate-800'}`}></div>

            <div className="p-6 sm:p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 mt-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center font-black text-2xl overflow-hidden shadow-sm">
                  {selectedStudent.user.avatarUrl ? <img src={selectedStudent.user.avatarUrl} className="w-full h-full object-cover" alt="avatar"/> : selectedStudent.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedStudent.user.name}</h3>
                  <p className="text-slate-500 text-sm font-medium">{selectedStudent.user.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-colors shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              
              {/* Statistiques Globales */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><KeyRound className="w-3.5 h-3.5" /> Date d'activation</p>
                  <p className="font-bold text-slate-900 text-sm">{new Date(selectedStudent.createdAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
                </div>
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Examen soumis le</p>
                  <p className="font-bold text-slate-900 text-sm">
                    {selectedStudent.completedAt ? new Date(selectedStudent.completedAt).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' }) : "Pas encore soumis"}
                  </p>
                </div>
                <div className="col-span-2 p-6 bg-slate-900 rounded-2xl border border-slate-800 flex justify-between items-center text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Temps d'apprentissage</p>
                    <p className="font-black text-2xl">{calculateDuration(selectedStudent.createdAt, selectedStudent.completedAt)}</p>
                  </div>
                  <div className="text-right relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Note de certification</p>
                    <p className={`font-black text-3xl ${selectedStudent.status === 'VALIDATED' ? 'text-emerald-400' : selectedStudent.status === 'FAILED' ? 'text-[#EB0A1E]' : 'text-white'}`}>
                      {selectedStudent.finalGrade !== null ? `${selectedStudent.finalGrade}/20` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Détails par leçon */}
              <div>
                <h4 className="font-black text-slate-900 mb-4 text-lg">Détail des chapitres validés</h4>
                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50">
                  {(!selectedStudent.user.lessonProgresses || selectedStudent.user.lessonProgresses.length === 0) ? (
                    <p className="p-6 text-slate-500 text-sm font-semibold text-center">Aucun chapitre terminé.</p>
                  ) : (
                    selectedStudent.user.lessonProgresses.map((progress, idx) => (
                      <div key={idx} className="p-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors">
                        <p className="text-sm font-bold text-slate-800 flex items-center gap-3">
                          <span className="w-6 h-6 bg-slate-100 text-slate-500 rounded-md flex items-center justify-center text-xs">{progress.lesson.order}</span>
                          {progress.lesson.title}
                        </p>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${(progress.score ?? 20) >= 10 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-[#EB0A1E] border border-red-100'}`}>
                          Score: {progress.score ?? 20}/20
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Score Examen Final Brut */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl flex justify-between items-center shadow-sm">
                <span className="font-black text-slate-700 uppercase tracking-wider text-xs">Note brute de l'Examen Final :</span>
                <span className="font-black text-lg bg-slate-100 px-3 py-1 rounded-lg text-slate-900">{selectedStudent.examScore !== null ? `${selectedStudent.examScore}/20` : 'Non passé'}</span>
              </div>
              
            </div>

            {/* Actions Administratives (Forcer le statut) */}
            <div className="p-6 sm:p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
              <button 
                onClick={() => handleOverrideStatus(selectedStudent.user.id, 'FAILED')}
                className="w-1/2 py-3.5 bg-white border-2 border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
              >
                <UserX className="w-4 h-4" /> Non Valider
              </button>
              <button 
                onClick={() => handleOverrideStatus(selectedStudent.user.id, 'VALIDATED')}
                className="w-1/2 py-3.5 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-emerald-600 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" /> Forcer Validation
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}