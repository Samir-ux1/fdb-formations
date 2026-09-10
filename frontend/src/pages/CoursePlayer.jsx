import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import YouTube from 'react-youtube';
import { useAuthStore } from '../store/authStore';
import {
  ArrowLeft, Lock, CheckCircle2, PlayCircle, FileText, PlaySquare, 
  HelpCircle, Trophy, XCircle, RotateCcw, Target, Award, ListChecks, ArrowRight
} from 'lucide-react';

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const getPdfDisplayUrl = (url) => {
  if (!url) return null;
  const match = url.match(/\/d\/(.+?)\//);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`; 
  }
  return url.endsWith('.pdf') ? `${url}#toolbar=0` : url;
};

export default function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { token, setLastCourseId } = useAuthStore();
  
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // État de la vidéo
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  
  // États Temps imparti
  const [isExpired, setIsExpired] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState(null);

  // --- NOUVEAUX ÉTATS DU QUIZ ---
  const [activeQuizQuestions, setActiveQuizQuestions] = useState([]); // Questions tirées au sort
  const [quizAttempts, setQuizAttempts] = useState(0); 
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); 
  const [chapterAnswers, setChapterAnswers] = useState({}); // Mémorise les choix { 0: 2, 1: 0, ... }
  const [score, setScore] = useState(0); 
  const [quizFinished, setQuizFinished] = useState(false); 
  const [savedScoreOn20, setSavedScoreOn20] = useState(null);

  // États Examen Final
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [examAnswers, setExamAnswers] = useState({});
  const [validationResult, setValidationResult] = useState(null);

  // 1. CHARGEMENT
  const fetchCourseData = async () => {
    try {
      const activeToken = token || localStorage.getItem('token');
      if (!activeToken) return navigate('/login'); 

      const response = await axios.get(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      
      setCourse(response.data);

      if (response.data.enrollment && response.data.enrollment.status !== 'IN_PROGRESS') {
        const start = new Date(response.data.enrollment.createdAt);
        const end = new Date(response.data.enrollment.completedAt);
        setValidationResult({
          status: response.data.enrollment.status,
          finalGrade: response.data.enrollment.finalGrade,
          quizScore: response.data.enrollment.quizScore,
          examScore: response.data.enrollment.examScore,
          durationHours: Math.round(Math.abs(end - start) / 36e5)
        });
      }

      if (response.data.enrollment && response.data.timeLimitDays) {
        const startDate = new Date(response.data.enrollment.createdAt);
        const deadline = new Date(startDate.getTime() + response.data.timeLimitDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        setDeadlineDate(deadline.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }));
        if (now > deadline && response.data.enrollment.status === 'IN_PROGRESS') setIsExpired(true);
      }
  
      if (!currentLesson && response.data.lessons.length > 0) {
        setCurrentLesson(response.data.lessons[0]);
      } else if (currentLesson) {
        const updatedLesson = response.data.lessons.find(l => l.id === currentLesson.id);
        setCurrentLesson(updatedLesson);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        alert("Vous devez débloquer ce cours pour le regarder !");
        navigate('/catalog');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
    if (courseId) localStorage.setItem('lastCourseId', courseId);
  }, [courseId]);

  // 2. MOTEUR DU QUIZ : GÉNÉRATION ET MÉLANGE
  const initializeQuiz = (lesson) => {
    if (lesson?.questions && lesson.questions.length > 0) {
      // Mélanger les questions
      let pool = [...lesson.questions].sort(() => 0.5 - Math.random());
      
      // Prendre le nombre demandé par l'instructeur
      const limit = lesson.quizQuestionCount || 0;
      if (limit > 0 && limit < pool.length) pool = pool.slice(0, limit);

      // Mélanger les réponses
      const preparedQs = pool.map(q => {
        const optsWithIdx = q.options.map((opt, i) => ({ text: opt, originalIdx: i }));
        const shuffled = optsWithIdx.sort(() => 0.5 - Math.random());
        return {
          ...q,
          shuffledOptions: shuffled.map(o => o.text),
          newCorrectIndex: shuffled.findIndex(o => o.originalIdx === q.correctAnswer)
        };
      });
      setActiveQuizQuestions(preparedQs);
    } else {
      setActiveQuizQuestions([]);
    }
    
    // Reset du quiz pour la tentative
    setCurrentQuestionIndex(0);
    setChapterAnswers({}); // Vide les réponses
    setScore(0);
    setQuizFinished(false);
  };

  // Chargement de la leçon
  useEffect(() => {
    if (!currentLesson) return;
    const progress = currentLesson.progresses?.length > 0 ? currentLesson.progresses[0] : null;

    if (progress && currentLesson.questions && currentLesson.questions.length > 0) {
      setQuizFinished(true);
      setSavedScoreOn20(progress.score !== null ? progress.score : 20);
      setQuizAttempts(1); // Force la fin des tentatives si déjà validé
    } else {
      initializeQuiz(currentLesson);
      setSavedScoreOn20(null);
      setQuizAttempts(0);
    }
    setIsVideoFinished(false);
  }, [currentLesson]);

  // 3. PROGRESSION
  const toggleComplete = async (lessonId, quizScore = 20) => {
    try {
      const activeToken = token || localStorage.getItem('token'); 
      await axios.post(`http://localhost:5000/api/courses/${courseId}/lessons/${lessonId}/progress`, 
      { score: quizScore }, { headers: { Authorization: `Bearer ${activeToken}` } });
      fetchCourseData(); 
    } catch (error) { console.error(error); }
  };

  const handleVideoEnd = () => {
    setIsVideoFinished(true);
    if (currentLesson?.questions && currentLesson.questions.length > 0) return;
    
    const isCompleted = currentLesson?.progresses?.length > 0;
    if (!isCompleted) toggleComplete(currentLesson.id, 20); 
    
    if (nextLesson) setTimeout(() => setCurrentLesson(nextLesson), 2000); 
  };

  // 4. ACTIONS DU QUIZ
  const handleSelectOption = (optionIndex) => {
    // Permet de changer d'avis (enregistre juste le choix)
    setChapterAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Fin du Quiz ! On calcule le score total
      let correct = 0;
      activeQuizQuestions.forEach((q, idx) => {
        if (chapterAnswers[idx] === q.newCorrectIndex) correct++;
      });

      const finalScoreOn20 = Math.round((correct / activeQuizQuestions.length) * 20);
      setScore(finalScoreOn20);
      setQuizFinished(true);

      // Si le score est 20/20 OU qu'il n'a plus d'essais, on sauvegarde
      if (finalScoreOn20 === 20 || quizAttempts >= 1) {
        setSavedScoreOn20(finalScoreOn20); 
        toggleComplete(currentLesson.id, finalScoreOn20);
      }
    }
  };

  const handleRetryQuiz = () => {
    setQuizAttempts(prev => prev + 1); // Consomme un essai
    initializeQuiz(currentLesson); // Re-mélange le quiz
  };

  // 5. EXAMEN FINAL
  const handleSubmitExam = async () => {
    if (!window.confirm("Valider l'examen ? Votre note finale sera calculée sur 20.")) return;
    
    const completedLessons = course.lessons.filter(l => l.progresses && l.progresses.length > 0);
    let totalQuizScore = 0;
    completedLessons.forEach(l => { totalQuizScore += (l.progresses[0].score !== null ? l.progresses[0].score : 20); });
    const averageQuizScore = completedLessons.length > 0 ? (totalQuizScore / completedLessons.length) : 0;

    let examCorrect = 0;
    const totalExamQs = course.examQuestions?.length || 0;
    if (totalExamQs > 0) {
      course.examQuestions.forEach((q, index) => {
        if (examAnswers[index] === q.correctAnswer) examCorrect++;
      });
    }
    const examScore = totalExamQs > 0 ? Math.round((examCorrect / totalExamQs) * 20) : 20;

    try {
      const activeToken = token || localStorage.getItem('token'); 
      const response = await axios.post(`http://localhost:5000/api/courses/${courseId}/grades`, {
        quizScore: averageQuizScore, examScore
      }, { headers: { Authorization: `Bearer ${activeToken}` } });
      
      setValidationResult(response.data.results);
      setShowFinalExam(false);
    } catch (error) {
      alert("Erreur serveur : " + (error.response?.data?.message || error.message));
    }
  };

  if (isLoading || !course) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-[#EB0A1E] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-6">
        <div className="bg-white p-10 rounded-sm border-t-4 border-red-600 shadow-xl max-w-md text-center">
          <div className="text-6xl mb-6">⏳</div>
          <h2 className="text-2xl font-black text-slate-900 uppercase mb-2">Temps imparti écoulé</h2>
          <p className="text-slate-600 mb-6">Vous aviez {course.timeLimitDays} jours pour terminer. Ce délai est dépassé.</p>
          <Link to="/dashboard" className="px-6 py-3 bg-[#111827] text-white font-bold rounded-sm uppercase text-xs hover:bg-[#EB0A1E] transition-colors">Retour au Dashboard</Link>
        </div>
      </div>
    );
  }

  const completedLessons = course.lessons.filter(l => l.progresses && l.progresses.length > 0).length;
  const progressPercentage = course.lessons.length === 0 ? 0 : Math.round((completedLessons / course.lessons.length) * 100);
  
  const currentIndex = course.lessons.findIndex(l => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;

  // LOGIQUE DU BOUTON (Vidéo ou PDF)
  const isCompleted = currentLesson?.progresses?.length > 0;
  const hasVideo = !!currentLesson?.videoUrl; 
  const canClickDone = isCompleted || isVideoFinished || !hasVideo; // Si c'est un PDF (!hasVideo), c'est débloqué

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-slate-800 pb-20">
      
      <header className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-sm hover:bg-slate-200 transition-colors font-bold">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-bold text-lg line-clamp-1 border-l-2 border-[#EB0A1E] pl-4 uppercase tracking-tight">{course.title}</h1>
        </div>
        <div className="hidden md:flex items-center gap-4">
          {deadlineDate && !validationResult && <span className="text-xs font-bold text-[#EB0A1E] px-3 py-1 bg-red-50 border border-red-100 uppercase tracking-widest rounded-sm">⏳ Avant le {deadlineDate}</span>}
          
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-8 space-y-6">
          
          {validationResult ? (
            /* --- RÉSULTAT FINAL --- */
            <div className="bg-[#111827] rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-800 text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${validationResult.isValidated ? 'bg-emerald-500 text-white' : 'bg-[#EB0A1E] text-white'}`}>
                  {validationResult.isValidated ? <Trophy className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-3 text-white tracking-tight">
                  {validationResult.isValidated ? 'Certification Validée !' : 'Échec de la validation'}
                </h2>
                <div className="bg-slate-800/50 p-6 md:p-8 rounded-2xl max-w-md mx-auto space-y-5 mb-10 border border-slate-700">
                  <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-bold uppercase">Moyenne Quiz (30%)</span><strong className="text-white text-lg">{validationResult.quizScore}/20</strong></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-slate-400 font-bold uppercase">Examen Final (70%)</span><strong className="text-white text-lg">{validationResult.examScore}/20</strong></div>
                  <div className="h-px bg-slate-700 my-4"></div>
                  <div className="flex justify-between items-center"><span className="text-white font-black text-lg">Note Finale</span><span className={`font-black text-3xl ${validationResult.isValidated ? 'text-emerald-400' : 'text-[#EB0A1E]'}`}>{validationResult.finalGrade}/20</span></div>
                </div>
                <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Retour au Tableau de bord
                </Link>
              </div>
            </div>

          ) : showFinalExam ? (
            /* --- EXAMEN FINAL --- */
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 border-t-4 border-t-[#EB0A1E]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center"><Target className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Évaluation Finale</h2>
                  <p className="text-slate-500 text-sm font-medium">Répondez à ces questions pour valider la formation.</p>
                </div>
              </div>
              
              <div className="mt-8 space-y-6">
                {(!course.examQuestions || course.examQuestions.length === 0) ? (
                  <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-slate-500 font-bold text-sm">Le questionnaire n'est pas disponible.</p></div>
                ) : (
                  course.examQuestions.map((q, i) => (
                    <div key={i} className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-100">
                      <p className="font-black text-base mb-5 text-slate-900"><span className="text-slate-400">Q{i+1}.</span> {q.questionText}</p>
                      <div className="space-y-3">
                        {(q.options || []).map((opt, optIndex) => (
                          <label key={optIndex} className={`flex items-center gap-4 p-4 bg-white rounded-xl border-2 cursor-pointer transition-all ${examAnswers[i] === optIndex ? 'border-[#EB0A1E] bg-red-50' : 'border-slate-200 hover:border-red-100'}`}>
                            <input type="radio" name={`exam-${i}`} checked={examAnswers[i] === optIndex} onChange={() => setExamAnswers({...examAnswers, [i]: optIndex})} className="w-5 h-5 accent-[#EB0A1E]"/>
                            <span className={`text-sm font-semibold ${examAnswers[i] === optIndex ? 'text-[#EB0A1E]' : 'text-slate-700'}`}>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {course.examQuestions && course.examQuestions.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end">
                  <button onClick={handleSubmitExam} className="px-8 py-4 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#EB0A1E] shadow-md transition-all active:scale-95 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Soumettre l'Évaluation
                  </button>
                </div>
              )}
            </div>
            ) : (
            /* --- LECTEUR ET CHAPITRE --- */
            <>
              {currentLesson?.pdfUrl ? (
                <div className="w-full h-[500px] md:h-[70vh] bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#EB0A1E] z-10"></div>
                  <embed src={getPdfDisplayUrl(currentLesson.pdfUrl.trim())} type="application/pdf" className="w-full h-full" />
                </div>
              ) : (
                <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                  {currentLesson?.videoUrl ? (
                    getYouTubeId(currentLesson.videoUrl.trim()) ? (
                      <YouTube videoId={getYouTubeId(currentLesson.videoUrl.trim())} opts={{ width: '100%', height: '100%', playerVars: { rel: 0, autoplay: 1 } }} onEnd={handleVideoEnd} className="absolute top-0 left-0 w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
                    ) : (
                      <video className="absolute top-0 left-0 w-full h-full" controls src={currentLesson.videoUrl.trim()} onEnded={handleVideoEnd}></video>
                    )
                  ) : (
                    <div className="flex flex-col h-full items-center justify-center text-slate-500 bg-slate-100"><PlaySquare className="w-12 h-12 mb-3 text-slate-300" /><p className="font-bold text-sm">Aucun média.</p></div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 relative">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#EB0A1E] mb-1 block">Chapitre {currentLesson?.order}</span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{currentLesson?.title}</h2>
                  </div>
                  
                  {currentLesson && (
                    <button 
                      onClick={() => toggleComplete(currentLesson.id, 20)}
                      disabled={!canClickDone || (currentLesson.questions && currentLesson.questions.length > 0)}
                      className={`px-5 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 ${
                        !canClickDone ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' : 
                        isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-[#111827] text-white hover:bg-[#EB0A1E] shadow-md active:scale-95'
                      }`}
                    >
                      {!canClickDone ? <><Lock className="w-4 h-4"/> {hasVideo ? "Lecture..." : "Lecture..."}</> : 
                       isCompleted ? <><CheckCircle2 className="w-4 h-4"/> Chapitre Validé</> : 
                       currentLesson.questions && currentLesson.questions.length > 0 ? <><ListChecks className="w-4 h-4"/> Valider le quiz</> : 
                       <><CheckCircle2 className="w-4 h-4"/> Marquer terminé</>}
                    </button>
                  )}
                </div>

                <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {currentLesson?.content}
                </div>

                {/* --- MOTEUR DE QUIZ DE CHAPITRE --- */}
                {activeQuizQuestions.length > 0 && (
                  <div className="mt-12 pt-8 border-t-4 border-slate-100">
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6 flex items-center gap-2">
                      <span className="w-8 h-8 bg-slate-100 text-red-600 flex items-center justify-center rounded-sm">📝</span> 
                      Quiz de validation
                    </h3>

                    {/* NOUVEAU : LE VERROU DU QUIZ EST DE RETOUR ! 🔒 */}
                    {(currentLesson?.videoUrl && !isVideoFinished && !(currentLesson?.progresses?.length > 0)) ? (
                      <div className="bg-slate-50 p-8 rounded-sm border border-slate-200 text-center shadow-sm">
                        <Lock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="font-bold text-slate-600 text-sm">Vous devez terminer la vidéo pour débloquer ce quiz.</p>
                      </div>
                    ) : !quizFinished ? (
                      <div className="bg-slate-50 p-6 sm:p-8 rounded-sm border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-[#111827] h-full"></div>
                        <div className="flex justify-between items-center mb-6 pl-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                            Question {currentQuestionIndex + 1} / {activeQuizQuestions.length}
                          </span>
                        </div>

                        <h4 className="text-lg sm:text-xl font-black text-slate-900 mb-6 pl-4">
                          {activeQuizQuestions[currentQuestionIndex]?.questionText}
                        </h4>
                        
                        <div className="space-y-3 pl-4">
                          {activeQuizQuestions[currentQuestionIndex]?.shuffledOptions.map((option, optIdx) => {
                            const isSelected = chapterAnswers[currentQuestionIndex] === optIdx;
                            // Design Aveugle : Gris/Blanc par défaut, Noir si sélectionné. Pas de rouge/vert.
                            let btnStyle = "border-slate-200 hover:border-slate-400 bg-white text-slate-700";
                            if (isSelected) {
                              btnStyle = "border-[#111827] bg-slate-100 text-[#111827] font-bold shadow-sm"; 
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectOption(optIdx)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${btnStyle}`}
                              >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-[#111827] bg-[#111827]' : 'border-slate-300 bg-transparent'}`}>
                                  {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                <span className="text-sm font-semibold">{option}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-8 flex justify-end animate-in fade-in slide-in-from-bottom-2 pl-4">
                          <button 
                            onClick={handleNextQuestion}
                            disabled={chapterAnswers[currentQuestionIndex] === undefined}
                            className="px-6 py-3 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#EB0A1E] transition-colors shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50"
                          >
                            {currentQuestionIndex < activeQuizQuestions.length - 1 ? (
                              <>Question suivante <ArrowRight className="w-4 h-4"/></>
                            ) : (
                              <>Voir le résultat <CheckCircle2 className="w-4 h-4"/></>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* RÉSULTAT DU QUIZ */
                      <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 text-center shadow-sm relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${score >= 10 ? 'bg-emerald-500' : 'bg-[#EB0A1E]'}`}></div>
                        
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${score >= 10 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-[#EB0A1E]'}`}>
                          {score === 20 ? <Trophy className="w-8 h-8" /> : score >= 10 ? <Award className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                        </div>
                        
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Quiz Terminé</h3>
                        <p className="text-sm text-slate-500 mb-6 font-medium">
                          Note obtenue : <strong className={`text-xl ml-1 ${score >= 10 ? 'text-emerald-600' : 'text-[#EB0A1E]'}`}>{score} / 20</strong>
                        </p>

                        {score >= 10 ? (
                          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs uppercase tracking-wider mb-6 border border-emerald-100 inline-block">
                            Chapitre validé avec succès
                          </div>
                        ) : (
                          <>
                            <div className="p-3 bg-red-50 text-[#EB0A1E] rounded-xl font-bold text-xs uppercase tracking-wider mb-6 border border-red-100 inline-block">
                              {quizAttempts >= 1 ? "Tentatives épuisées. Score enregistré." : "La moyenne (10/20) est requise. Il vous reste 1 tentative."}
                            </div>
                            {quizAttempts < 1 && (
                              <div className="mt-2">
                                <button onClick={handleRetryQuiz} className="px-6 py-3 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors inline-flex items-center gap-2">
                                  <RotateCcw className="w-4 h-4" /> Recommencer le quiz
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* BOUTONS PRÉCÉDENT / SUIVANT */}
                <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-100">
                  <button onClick={() => setCurrentLesson(prevLesson)} disabled={!prevLesson} className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${prevLesson ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-transparent text-slate-300 cursor-not-allowed'}`}>
                    <ArrowLeft className="w-4 h-4" /> Précédent
                  </button>
                  <button onClick={() => setCurrentLesson(nextLesson)} disabled={!nextLesson || !isCompleted} className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${(nextLesson && isCompleted) ? 'bg-red-50 text-[#EB0A1E] hover:bg-red-100' : 'bg-transparent text-slate-300 cursor-not-allowed'}`}>
                    Suivant <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* SOMMAIRE DES LEÇONS (Sidebar Droite) */}
        <aside className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-bold text-lg uppercase tracking-tight">Contenu du cours</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{completedLessons} / {course.lessons.length} leçons</p>
            </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            {course.lessons.length === 0 ? (
              <p className="p-6 text-slate-500 text-center text-xs font-semibold">Le programme n'a pas encore été publié.</p>
            ) : (
              course.lessons.map((lesson, index) => {
                const isActive = currentLesson?.id === lesson.id && !showFinalExam && !validationResult;
                const isDone = lesson.progresses && lesson.progresses.length > 0;
                
                const previousLesson = index > 0 ? course.lessons[index - 1] : null;
                const isLocked = previousLesson && (!previousLesson.progresses || previousLesson.progresses.length === 0);
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => !isLocked && setCurrentLesson(lesson)}
                    disabled={isLocked}
                    className={`w-full text-left p-4 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-0
                      ${isActive ? 'bg-red-50/50 border-l-4 border-l-[#EB0A1E]' : 'border-l-4 border-l-transparent'}
                      ${isLocked ? 'opacity-60 cursor-not-allowed bg-slate-50/50' : 'hover:bg-slate-50'}
                    `}
                  >
                    <div className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors
                      ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 
                        isActive ? 'border-[#EB0A1E] text-[#EB0A1E]' :
                        isLocked ? 'border-slate-300 text-slate-400 bg-slate-100' : 
                        'border-slate-300 text-transparent'}`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : 
                       isActive ? <PlayCircle className="w-4 h-4" /> : 
                       isLocked ? <Lock className="w-3.5 h-3.5" /> : null}
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                        Chapitre {lesson.order}
                      </p>
                      <h4 className={`font-semibold text-sm line-clamp-2 leading-snug ${isActive ? 'text-[#EB0A1E] font-black' : 'text-slate-700'}`}>
                        {lesson.title}
                      </h4>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          
          {/* BOUTON EXAMEN FINAL */}
          {!validationResult && (
            <div className="p-5 bg-slate-50 border-t border-slate-200 mt-auto shrink-0">
              <button 
                onClick={() => setShowFinalExam(true)}
                disabled={completedLessons < course.lessons.length}
                className={`w-full py-4 text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                  completedLessons < course.lessons.length 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300' 
                  : showFinalExam 
                    ? 'bg-[#111827] text-white ring-4 ring-slate-200' 
                    : 'bg-[#111827] text-white hover:bg-[#EB0A1E] active:scale-95'
                }`}
              >
                {completedLessons < course.lessons.length ? (
                  <><Lock className="w-4 h-4"/> Complétez le programme</>
                ) : (
                  <><Target className="w-4 h-4"/> Passer l'evaluation</>
                )}
              </button>
            </div>
          )}

        </aside>

      </main>
    </div>
  );
}