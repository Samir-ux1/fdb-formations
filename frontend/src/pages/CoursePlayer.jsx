import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import YouTube from 'react-youtube';
import { useAuthStore } from '../store/authStore';
import {
  ArrowLeft, Lock, CheckCircle2, PlayCircle, FileText, PlaySquare, 
  HelpCircle, Trophy, XCircle, RotateCcw, Target, Award, ListChecks, ArrowRight
} from 'lucide-react';

export default function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isVideoFinished, setIsVideoFinished] = useState(false);

  // --- ÉTATS POUR LE QUIZ ÉTAPE PAR ÉTAPE ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); 
  const [selectedOption, setSelectedOption] = useState(null); 
  const [isAnswered, setIsAnswered] = useState(false); 
  const [score, setScore] = useState(0); 
  const [quizFinished, setQuizFinished] = useState(false); 
  const [savedScoreOn20, setSavedScoreOn20] = useState(null); 

  // ÉTATS EXAMEN FINAL
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [examAnswers, setExamAnswers] = useState({});
  const [validationResult, setValidationResult] = useState(null);

  const { token, setLastCourseId } = useAuthStore();

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

  const fetchCourseData = async () => {
    try {
      const activeToken = token || localStorage.getItem('token');
      if (!activeToken) return navigate('/login'); 

      const response = await axios.get(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      
      setCourse(response.data);

      if (response.data.enrollment && response.data.enrollment.status !== 'IN_PROGRESS') {
        setValidationResult({
          status: response.data.enrollment.status,
          finalGrade: response.data.enrollment.finalGrade,
          quizScore: response.data.enrollment.quizScore,
          examScore: response.data.enrollment.examScore
        });
      }
  
      if (!currentLesson && response.data.lessons.length > 0) {
        setCurrentLesson(response.data.lessons[0]);
      } else if (currentLesson) {
        const updatedLesson = response.data.lessons.find(l => l.id === currentLesson.id);
        setCurrentLesson(updatedLesson);
      }
    } catch (err) {
      console.error(err);
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
    if (courseId) {
      localStorage.setItem('lastCourseId', courseId);
    }
  }, [courseId]);

  useEffect(() => {
    if (!currentLesson) return;

    const progress = currentLesson.progresses?.length > 0 ? currentLesson.progresses[0] : null;

    if (progress && currentLesson.questions && currentLesson.questions.length > 0) {
      setQuizFinished(true);
      setSavedScoreOn20(progress.score); 
    } else {
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setScore(0);
      setQuizFinished(false);
      setSavedScoreOn20(null);
    }
    
    setIsVideoFinished(false);
  }, [currentLesson]);

  // --- NOUVEAU : CHRONOMÈTRE DE TEMPS D'APPRENTISSAGE ---
  useEffect(() => {
    if (!courseId) return;

    // Toutes les 5 secondes, on ajoute 5 secondes au compteur de cet étudiant
    const timer = setInterval(() => {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) return;

      // Crée une clé unique : ex: "time_student1_course5"
      const storageKey = `time_user_${userData.id}_course_${courseId}`;
      
      // On récupère le temps précédent (ou 0 par défaut)
      const currentSeconds = parseInt(localStorage.getItem(storageKey) || '0', 10);
      
      // On sauvegarde le nouveau temps (+5 secondes)
      localStorage.setItem(storageKey, currentSeconds + 5);
    }, 5000);

    // On coupe le chronomètre dès que l'étudiant quitte la page !
    return () => clearInterval(timer);
  }, [courseId]);

  const toggleComplete = async (lessonId, quizScore = 20) => {
    try {
      const activeToken = localStorage.getItem('token'); 
      await axios.post(`http://localhost:5000/api/courses/${courseId}/lessons/${lessonId}/progress`, 
      { score: quizScore }, 
      { headers: { Authorization: `Bearer ${activeToken}` } });
      
      fetchCourseData(); 
    } catch (error) {
      console.error(error);
      alert("Erreur Backend : " + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmitExam = async () => {
    if (!window.confirm("Valider l'examen ? Votre note finale sera calculée sur 20.")) return;
    
    const completedLessons = course.lessons.filter(l => l.progresses && l.progresses.length > 0);
    let totalQuizScore = 0;
    completedLessons.forEach(l => { 
      totalQuizScore += (l.progresses[0].score !== null ? l.progresses[0].score : 20); 
    });
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
        quizScore: averageQuizScore,
        examScore: examScore
      }, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      
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

  const completedLessons = course.lessons.filter(l => l.progresses && l.progresses.length > 0).length;
  const progressPercentage = course.lessons.length === 0 ? 0 : Math.round((completedLessons / course.lessons.length) * 100);
  const isCurrentLessonCompleted = currentLesson?.progresses?.length > 0;

  const handleVideoEnd = () => {
    setIsVideoFinished(true);
    if (currentLesson?.questions && currentLesson.questions.length > 0) return;
    const isCompleted = currentLesson?.progresses?.length > 0;
    if (!isCompleted) {
      toggleComplete(currentLesson.id, 20); 
    }
    if (nextLesson) {
      setTimeout(() => setCurrentLesson(nextLesson), 2000); 
    }
  };

  const currentIndex = course.lessons.findIndex(l => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;

  const handleSelectOption = (optionIndex) => {
    if (isAnswered) return; 
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    const currentQ = currentLesson.questions[currentQuestionIndex];
    if (optionIndex === currentQ.correctAnswer) {
      setScore(prev => prev + 1); 
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentLesson.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setQuizFinished(true);
      const scoreSur20 = Math.round((score / currentLesson.questions.length) * 20);
      setSavedScoreOn20(scoreSur20); 
      toggleComplete(currentLesson.id, scoreSur20);
    }
  };

  const handleRetryQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 pb-20">
      
      {/* HEADER LECTEUR */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 h-16 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-[#EB0A1E] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col border-l-2 border-slate-200 pl-4">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Salle de formation virtuelle</span>
            <h1 className="font-black text-sm md:text-base text-slate-900 line-clamp-1">{course.title}</h1>
          </div>
        </div>
        
        {/* BARRE DE PROGRESSION */}
        <div className="hidden md:flex items-center gap-4 w-64">
          <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
            <div className="bg-[#EB0A1E] h-2.5 rounded-full transition-all duration-700" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <span className="text-xs font-black text-slate-900 w-10 text-right">{progressPercentage}%</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LECTEUR VIDÉO ET CONTENU (À gauche) */}
        <div className="lg:col-span-8 space-y-6">
          
          {validationResult ? (
            /* 1. ÉCRAN DE RÉSULTAT FINAL */
            <div className="bg-[#111827] rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-800 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-slate-700 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
              
              <div className="relative z-10">
                <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 shadow-xl ${validationResult.isValidated ? 'bg-emerald-500 text-white' : 'bg-[#EB0A1E] text-white'}`}>
                  {validationResult.isValidated ? <Trophy className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
                </div>
                
                <h2 className="text-3xl md:text-4xl font-black mb-3 text-white tracking-tight">
                  {validationResult.isValidated ? 'Certification Validée !' : 'Échec de la validation'}
                </h2>
                <p className="text-slate-400 text-sm mb-8">
                  {validationResult.isValidated ? 'Félicitations, vous avez acquis ces nouvelles compétences avec succès.' : 'Vos résultats sont insuffisants pour valider ce module. Contactez votre formateur.'}
                </p>

                <div className="bg-slate-800/50 p-6 md:p-8 rounded-2xl max-w-md mx-auto space-y-5 mb-10 border border-slate-700 backdrop-blur-sm">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Moyenne des Quiz (30%)</span> 
                    <strong className="text-white text-lg">{validationResult.quizScore}/20</strong>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Examen Final (70%)</span> 
                    <strong className="text-white text-lg">{validationResult.examScore}/20</strong>
                  </div>
                  <div className="h-px bg-slate-700 my-4"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-black text-lg">Note Finale de Certification</span> 
                    <span className={`font-black text-3xl ${validationResult.isValidated ? 'text-emerald-400' : 'text-[#EB0A1E]'}`}>
                      {validationResult.finalGrade}/20
                    </span>
                  </div>
                </div>

                <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors shadow-md active:scale-95">
                  <ArrowLeft className="w-4 h-4" /> Retour au Tableau de bord
                </Link>
              </div>
            </div>

          ) : showFinalExam ? (
            /* 2. ÉCRAN DE L'EXAMEN FINAL */
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#111827]"></div>
              
              <div className="flex items-center gap-3 mb-3 mt-2">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Évaluation Finale</h2>
                  <p className="text-slate-500 text-sm font-medium">Répondez à ces questions pour valider la formation (70% de la note finale).</p>
                </div>
              </div>
              
              <div className="mt-8 space-y-6">
                {(!course.examQuestions || course.examQuestions.length === 0) ? (
                  <div className="text-center p-8 bg-slate-50 rounded-2xl border border-slate-100">
                    <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-bold text-sm">Le questionnaire n'est pas encore disponible.</p>
                  </div>
                ) : (
                  course.examQuestions.map((q, i) => (
                    <div key={i} className="bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-100">
                      <p className="font-black text-base mb-5 text-slate-900 flex gap-2">
                        <span className="text-slate-400">Q{i+1}.</span> {q.questionText}
                      </p>
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
            /* 3. ÉCRAN LECTEUR VIDÉO, PDF ET QUIZ CHAPITRE */
            <>
              {currentLesson?.pdfUrl ? (
                // --- LECTEUR PDF ---
                <div className="w-full h-[500px] md:h-[70vh] bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-200 relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#EB0A1E] z-10"></div>
                  <iframe 
                    src={getPdfDisplayUrl(currentLesson.pdfUrl.trim())} 
                    className="w-full h-full" 
                    title="Document PDF"
                    allow="autoplay"
                  />
                </div>
              ) : (
                // --- LECTEUR VIDÉO ---
                <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                  {currentLesson?.videoUrl ? (
                    getYouTubeId(currentLesson.videoUrl.trim()) ? (
                      <YouTube videoId={getYouTubeId(currentLesson.videoUrl.trim())} opts={{ width: '100%', height: '100%', playerVars: { rel: 0, autoplay: 1 } }} onEnd={handleVideoEnd} className="absolute top-0 left-0 w-full h-full [&>iframe]:w-full [&>iframe]:h-full" />
                    ) : (
                      <video className="absolute top-0 left-0 w-full h-full" controls src={currentLesson.videoUrl.trim()} onEnded={handleVideoEnd}>Votre navigateur ne supporte pas la vidéo.</video>
                    )
                  ) : (
                    <div className="flex flex-col h-full items-center justify-center text-slate-500 bg-slate-100">
                      <PlaySquare className="w-12 h-12 mb-3 text-slate-300" />
                      <p className="font-bold text-sm">Aucun média disponible pour cette leçon.</p>
                    </div>
                  )}
                </div>
              )}

              {/* DÉTAILS DE LA LEÇON & BOUTON D'ACTION */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 relative">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#EB0A1E] mb-1 block">
                      {currentLesson ? `Chapitre ${currentLesson.order}` : 'Introduction'}
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {currentLesson ? currentLesson.title : "Bienvenue dans la formation"}
                    </h2>
                  </div>
                  
                  {currentLesson && (() => {
                    const isCompleted = currentLesson?.progresses?.length > 0;
                    const hasVideo = !!currentLesson.videoUrl; 
                    const canClickDone = isCompleted || isVideoFinished || !hasVideo;

                    return (
                      <button 
                        onClick={() => toggleComplete(currentLesson.id, 20)}
                        disabled={!canClickDone || (currentLesson.questions && currentLesson.questions.length > 0)}
                        className={`px-5 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 ${
                          !canClickDone 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
                            : isCompleted 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-[#111827] text-white hover:bg-[#EB0A1E] shadow-md active:scale-95'
                        }`}
                      >
                        {!canClickDone ? (
                          <><Lock className="w-4 h-4"/> {hasVideo ? "Lecture..." : "Lecture..."}</>
                        ) : isCompleted ? (
                          <><CheckCircle2 className="w-4 h-4"/> Chapitre Validé</>
                        ) : currentLesson.questions && currentLesson.questions.length > 0 ? (
                          <><ListChecks className="w-4 h-4"/> Valider le quiz</>
                        ) : (
                          <><CheckCircle2 className="w-4 h-4"/> Marquer terminé</>
                        )}
                      </button>
                    );
                  })()}
                </div>

                <div className="prose prose-sm prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {currentLesson ? currentLesson.content : course.description}
                </div>

                {/* ================= SECTION QUIZ ÉTAPE PAR ÉTAPE ================= */}
                {currentLesson?.questions && currentLesson.questions.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-slate-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                        <ListChecks className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900">Quiz de vérification</h3>
                    </div>

                    {!quizFinished ? (
                      /* L'ÉTUDIANT EST EN TRAIN DE JOUER */
                      <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 bg-[#111827] h-full"></div>
                        
                        <div className="flex justify-between items-center mb-6 pl-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
                            Question {currentQuestionIndex + 1} / {currentLesson.questions.length}
                          </span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Score actuel: {score}
                          </span>
                        </div>

                        <h4 className="text-lg sm:text-xl font-black text-slate-900 mb-6 pl-4">
                          {currentLesson.questions[currentQuestionIndex].questionText}
                        </h4>
                        
                        <div className="space-y-3 pl-4">
                          {currentLesson.questions[currentQuestionIndex].options.map((option, optIdx) => {
                            const currentQ = currentLesson.questions[currentQuestionIndex];
                            const isSelected = selectedOption === optIdx;
                            const isCorrect = currentQ.correctAnswer === optIdx;
                            
                            let buttonStyle = "border-slate-200 hover:border-slate-400 bg-white text-slate-700";
                            
                            if (isAnswered) {
                              if (isCorrect) {
                                buttonStyle = "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-sm"; 
                              } else if (isSelected && !isCorrect) {
                                buttonStyle = "border-red-500 bg-red-50 text-red-700 font-bold"; 
                              } else {
                                buttonStyle = "border-slate-200 bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"; 
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectOption(optIdx)}
                                disabled={isAnswered}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${buttonStyle}`}
                              >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                                  ${isAnswered && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 
                                    isAnswered && isSelected && !isCorrect ? 'border-red-500 bg-red-500 text-white' :
                                    'border-slate-300 bg-transparent'}`}>
                                  {(isAnswered && isCorrect) ? <CheckCircle2 className="w-3 h-3" /> : 
                                   (isAnswered && isSelected && !isCorrect) ? <XCircle className="w-3 h-3" /> : null}
                                </div>
                                <span className="text-sm font-semibold">{option}</span>
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered && (
                          <div className="mt-8 flex justify-end animate-in fade-in slide-in-from-bottom-2 pl-4">
                            <button 
                              onClick={handleNextQuestion}
                              className="px-6 py-3 bg-[#111827] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#EB0A1E] transition-colors shadow-md flex items-center gap-2 active:scale-95"
                            >
                              {currentQuestionIndex < currentLesson.questions.length - 1 ? (
                                <>Question suivante <ArrowRight className="w-4 h-4"/></>
                              ) : (
                                <>Voir le résultat <CheckCircle2 className="w-4 h-4"/></>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                    ) : (
                      /* RÉSULTAT DU QUIZ */
                      <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 text-center shadow-sm relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${savedScoreOn20 >= 10 ? 'bg-emerald-500' : 'bg-[#EB0A1E]'}`}></div>
                        
                        <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${savedScoreOn20 >= 10 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-[#EB0A1E]'}`}>
                          {savedScoreOn20 === 20 ? <Trophy className="w-8 h-8" /> : savedScoreOn20 >= 10 ? <Award className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                        </div>
                        
                        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Quiz Terminé</h3>
                        <p className="text-sm text-slate-500 mb-6 font-medium">
                          Note enregistrée : <strong className={`text-xl ml-1 ${savedScoreOn20 >= 10 ? 'text-emerald-600' : 'text-[#EB0A1E]'}`}>{savedScoreOn20} / 20</strong>
                        </p>

                        {savedScoreOn20 >= 10 ? (
                          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs uppercase tracking-wider mb-6 border border-emerald-100 inline-block">
                            Chapitre validé avec succès
                          </div>
                        ) : (
                          <div className="p-3 bg-red-50 text-[#EB0A1E] rounded-xl font-bold text-xs uppercase tracking-wider mb-6 border border-red-100 inline-block">
                            La moyenne (10/20) est requise
                          </div>
                        )}

                        <div>
                          <button 
                            onClick={handleRetryQuiz}
                            className="px-6 py-3 bg-slate-100 text-slate-700 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-200 transition-colors inline-flex items-center gap-2"
                          >
                            <RotateCcw className="w-4 h-4" /> Recommencer le quiz
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* BOUTONS PRÉCÉDENT / SUIVANT */}
                <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-100">
                  <button 
                    onClick={() => setCurrentLesson(prevLesson)}
                    disabled={!prevLesson}
                    className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
                      prevLesson ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-transparent text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" /> Précédent
                  </button>

                  <button 
                    onClick={() => setCurrentLesson(nextLesson)}
                    disabled={!nextLesson || !isCurrentLessonCompleted}
                    className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
                      (nextLesson && isCurrentLessonCompleted)
                      ? 'bg-red-50 text-[#EB0A1E] hover:bg-red-100' 
                      : 'bg-transparent text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    Suivant <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* SOMMAIRE DES LEÇONS (Sidebar Droite) */}
        <aside className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">Programme</h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">{completedLessons} sur {course.lessons.length} validés</p>
            </div>
          </div>
          
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            {course.lessons.length === 0 ? (
              <p className="p-6 text-slate-500 text-center text-xs font-semibold">Le programme n'a pas encore été publié.</p>
            ) : (
              course.lessons.map((lesson, index) => {
                const isActive = currentLesson?.id === lesson.id;
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
                    {/* ICONE STATUT */}
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