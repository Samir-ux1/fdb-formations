import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import YouTube from 'react-youtube';
import { useAuthStore } from '../store/authStore';

export default function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Permet de savoir si l'étudiant a fini de regarder
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  // --- ÉTATS POUR LE QUIZ ÉTAPE PAR ÉTAPE ---
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Savoir à quelle question on est
  const [selectedOption, setSelectedOption] = useState(null); // L'option cliquée
  const [isAnswered, setIsAnswered] = useState(false); // Est-ce qu'il a répondu à la question actuelle ?
  const [score, setScore] = useState(0); // Le score total
  const [quizFinished, setQuizFinished] = useState(false); // Le quiz est-il terminé ?
  const [savedScoreOn20, setSavedScoreOn20] = useState(null); // <-- NOUVEAU

  // ÉTATS EXAMEN FINAL
  const [showFinalExam, setShowFinalExam] = useState(false);
  const [examAnswers, setExamAnswers] = useState({});
  const [validationResult, setValidationResult] = useState(null);

  const { token, setLastCourseId } = useAuthStore();

  // Fonction magique pour extraire l'ID d'une vidéo YouTube
  const getYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

  const fetchCourseData = async () => {
    try {
      // 1. On crée un token de secours pour éviter la milliseconde de vide de Zustand
      const activeToken = token || localStorage.getItem('token');
      
      if (!activeToken) return navigate('/login'); // On renvoie vers le login, pas vers '/'

      const response = await axios.get(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      
      setCourse(response.data);

      // --- NOUVEAU : VÉRIFIER SI LE COURS EST DÉJÀ VALIDÉ ---
      if (response.data.enrollment && response.data.enrollment.status !== 'IN_PROGRESS') {
        // On calcule le temps passé
        const start = new Date(response.data.enrollment.createdAt);
        const end = new Date(response.data.enrollment.completedAt);
        const durationHours = Math.round(Math.abs(end - start) / 36e5);

        // On affiche directement le résultat !
         setValidationResult({
          status: response.data.enrollment.status,
          finalGrade: response.data.enrollment.finalGrade,
          quizScore: response.data.enrollment.quizScore,
          examScore: response.data.enrollment.examScore
        });
      }
  
      // Sélectionne la première leçon si aucune n'est sélectionnée
      if (!currentLesson && response.data.lessons.length > 0) {
        setCurrentLesson(response.data.lessons[0]);
      } else if (currentLesson) {
        // Met à jour la leçon actuelle si on vient de cocher une case
        const updatedLesson = response.data.lessons.find(l => l.id === currentLesson.id);
        setCurrentLesson(updatedLesson);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message;
      
      // Si le backend dit "Accès refusé" (403), on le renvoie au Dashboard
      if (err.response?.status === 403) {
        alert("Vous devez débloquer ce cours pour le regarder !");
        navigate('/catalog');
      } else {
        setError(errorMessage || "Erreur de connexion au serveur");
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

 // --- CHARGEMENT D'UNE LEÇON (Vérifier la mémoire) ---
  useEffect(() => {
    if (!currentLesson) return;

    // On cherche si l'étudiant a déjà une progression sauvegardée pour cette leçon
    const progress = currentLesson.progresses?.length > 0 ? currentLesson.progresses[0] : null;

    if (progress && currentLesson.questions && currentLesson.questions.length > 0) {
      // SI LE QUIZ A DÉJÀ ÉTÉ FAIT : On affiche directement l'écran de résultat !
      setQuizFinished(true);
      setSavedScoreOn20(progress.score); // On récupère sa note depuis la BDD
    } else {
      // SINON : On remet le quiz à zéro
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setScore(0);
      setQuizFinished(false);
      setSavedScoreOn20(null);
    }
    
    setIsVideoFinished(false);
  }, [currentLesson]);

  // FONCTION POUR COCHER/DÉCOCHER UNE LEÇON
  const toggleComplete = async (lessonId, quizScore = 20) => {
    try {
      const token = localStorage.getItem('token'); // <-- LA LIGNE MAGIQUE EST LÀ !
      
      await axios.post(`http://localhost:5000/api/courses/${courseId}/lessons/${lessonId}/progress`, 
      { score: quizScore }, 
      { headers: { Authorization: `Bearer ${token}` } });
      
      fetchCourseData(); 
    } catch (error) {
      console.error(error);
      alert("Erreur Backend : " + (error.response?.data?.message || error.message));
    }
  };

  

  // --- CALCULATION DU RÉSULTAT FINAL SUR 20 ---
  const handleSubmitExam = async () => {
    if (!window.confirm("Valider l'examen ? Votre note finale sera calculée sur 20.")) return;
    
    // 1. Moyenne des quiz de chapitres (sur 20)
    const completedLessons = course.lessons.filter(l => l.progresses && l.progresses.length > 0);
    let totalQuizScore = 0;
    completedLessons.forEach(l => { 
      // On récupère le score enregistré sur 20
      totalQuizScore += (l.progresses[0].score !== null ? l.progresses[0].score : 20); 
    });
    const averageQuizScore = completedLessons.length > 0 ? (totalQuizScore / completedLessons.length) : 0;

    // 2. Calcul du score de l'Examen Final (sur 20)
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

  if (isLoading || !course) return <div className="min-h-screen flex justify-center items-center">Chargement...</div>;

  // Calcul de la progression (%)
  const completedLessons = course.lessons.filter(l => l.progresses && l.progresses.length > 0).length;
  const progressPercentage = course.lessons.length === 0 ? 0 : Math.round((completedLessons / course.lessons.length) * 100);
  const isCurrentLessonCompleted = currentLesson?.progresses?.length > 0;

  // --- GESTION DE LA VIDÉO ---
  const handleVideoEnd = () => {
    setIsVideoFinished(true);

    // 1. SI LA LEÇON A UN QUIZ : On s'arrête là ! L'étudiant doit faire le quiz.
    if (currentLesson?.questions && currentLesson.questions.length > 0) return;

    // 2. S'IL N'Y A PAS DE QUIZ : On valide automatiquement la vidéo avec 20/20.
    const isCurrentLessonCompleted = currentLesson?.progresses?.length > 0;
    if (!isCurrentLessonCompleted) {
      toggleComplete(currentLesson.id, 20); // Note parfaite de 20/20 par défaut
    }

    // On passe à la suite
    if (nextLesson) {
      setTimeout(() => setCurrentLesson(nextLesson), 2000); 
    }
  };
    

  // --- CALCUL DE LA NAVIGATION (Précédent / Suivant) ---
  const currentIndex = course.lessons.findIndex(l => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < course.lessons.length - 1 ? course.lessons[currentIndex + 1] : null;

  // --- GESTION DU QUIZ ---
  const handleSelectOption = (optionIndex) => {
    if (isAnswered) return; // Si on a déjà répondu, on bloque le clic !
    
    setSelectedOption(optionIndex);
    setIsAnswered(true);

    // On vérifie immédiatement si c'est la bonne réponse
    const currentQ = currentLesson.questions[currentQuestionIndex];
    if (optionIndex === currentQ.correctAnswer) {
      setScore(prev => prev + 1); // On augmente le score
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentLesson.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Le Quiz est fini !
      setQuizFinished(true);
      
      // On calcule la note sur 20
      const scoreSur20 = Math.round((score / currentLesson.questions.length) * 20);
      setSavedScoreOn20(scoreSur20); // On affiche la note

      // On sauvegarde dans la base de données
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      <header className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between shrink-0 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <span className="font-bold">←</span>
          </Link>
          <h1 className="font-bold text-lg line-clamp-1 border-l-2 border-slate-200 pl-4">{course.title}</h1>
        </div>
        
        {/* BARRE DE PROGRESSION EN HAUT */}
        <div className="hidden md:flex items-center gap-4 w-64">
          <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <span className="text-sm font-bold text-blue-600">{progressPercentage}%</span>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LECTEUR VIDÉO ET BOUTON (À gauche) */}
        <div className="lg:col-span-8 space-y-6">
          {validationResult ? (
            /* 1. ÉCRAN DE RÉSULTAT FINAL */
            <div className="bg-white rounded-3xl p-10 shadow-lg border border-slate-200 text-center">
              <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-6xl mb-6 shadow-inner ${validationResult.isValidated ? 'bg-green-100' : 'bg-red-100'}`}>
                {validationResult.isValidated ? '🏆' : '❌'}
              </div>
              <h2 className="text-4xl font-black mb-4 text-slate-900">
                {validationResult.isValidated ? 'Formation Validée !' : 'Échec de la validation'}
              </h2>
              <div className="bg-slate-50 p-8 rounded-2xl max-w-md mx-auto space-y-4 mb-8 text-left border border-slate-100">
                <p className="flex justify-between text-lg text-slate-600"><span>Moyenne des Quiz (30%) :</span> <strong className="text-slate-900">{validationResult.quizScore}/20</strong></p>
                <p className="flex justify-between text-lg text-slate-600"><span>Examen Final (70%) :</span> <strong className="text-slate-900">{validationResult.examScore}/20</strong></p>
                <div className="h-px bg-slate-200 my-4"></div>
                <p className="flex justify-between text-2xl text-blue-600 font-black">
                  <span>Note Finale :</span> <span>{validationResult.finalGrade}/20</span>
                </p>
              </div>
              <Link to="/dashboard" className="inline-block px-10 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                Retour au Tableau de bord
              </Link>
            </div>

          ) : showFinalExam ? (
            /* 2. ÉCRAN DE L'EXAMEN FINAL (SÉCURISÉ) */
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200">
              <h2 className="text-3xl font-black mb-2 text-slate-900">Examen Final</h2>
              <p className="text-slate-500 mb-8">Répondez à ces questions pour valider la formation. (Compte pour 70% de la note finale).</p>
              
              {(!course.examQuestions || course.examQuestions.length === 0) ? (
                <p className="text-slate-500 italic p-6 bg-slate-50 rounded-xl">L'instructeur n'a pas encore ajouté de questions à cet examen.</p>
              ) : (
                course.examQuestions.map((q, i) => (
                  <div key={i} className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="font-bold text-lg mb-4 text-slate-800">{i+1}. {q.questionText}</p>
                    <div className="space-y-3">
                      {/* SÉCURITÉ : On ajoute (q.options || []) pour éviter le crash si options est vide ! */}
                      {(q.options || []).map((opt, optIndex) => (
                        <label key={optIndex} className={`flex items-center gap-4 p-4 bg-white rounded-xl border-2 cursor-pointer transition-all ${examAnswers[i] === optIndex ? 'border-purple-600 bg-purple-50' : 'border-slate-200 hover:border-purple-300'}`}>
                          <input type="radio" name={`exam-${i}`} checked={examAnswers[i] === optIndex} onChange={() => setExamAnswers({...examAnswers, [i]: optIndex})} className="w-5 h-5 text-purple-600"/>
                          <span className={examAnswers[i] === optIndex ? 'font-bold text-purple-900' : 'text-slate-700'}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}

              {course.examQuestions && course.examQuestions.length > 0 && (
                <button onClick={handleSubmitExam} className="w-full py-5 bg-purple-600 text-white text-xl font-black rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-600/30 transition-all">
                  Soumettre l'Examen 🎓
                </button>
              )}
            </div>
            ) : (
            /* 3. ÉCRAN LECTEUR VIDÉO ET QUIZ CHAPITRE */
            <>
          <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-lg">
            {currentLesson?.videoUrl ? (
              getYouTubeId(currentLesson.videoUrl.trim()) ? (
                // LE NOUVEAU LECTEUR REACT-YOUTUBE (avec l'événement onEnd)
                <YouTube 
                  videoId={getYouTubeId(currentLesson.videoUrl.trim())}
                  opts={{ width: '100%', height: '100%', playerVars: { rel: 0, autoplay: 1 } }}
                  onEnd={handleVideoEnd}
                  className="absolute top-0 left-0 w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
                />
              ) : (
                // LE LECTEUR MP4 CLASSIQUE (avec l'événement onEnded)
                <video 
                  className="absolute top-0 left-0 w-full h-full" 
                  controls 
                  src={currentLesson.videoUrl.trim()}
                  onEnded={handleVideoEnd}
                >
                  Votre navigateur ne supporte pas la vidéo.
                </video>
              )
            ) : (
              <div className="flex flex-col h-full items-center justify-center text-slate-400">
                <span className="text-5xl mb-4 opacity-50">⏸</span>
                <p>Aucune vidéo disponible pour cette leçon.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold">
                {currentLesson ? currentLesson.title : "Bienvenue dans la formation"}
              </h2>
              
              {/* BOUTON TERMINER LA LECON */}
              {currentLesson && (() => {
                const isCurrentLessonCompleted = currentLesson?.progresses?.length > 0;
                const canClickDone = isCurrentLessonCompleted || isVideoFinished;

                return (
                  <button 
                    onClick={() => toggleComplete(currentLesson.id, 20)} // <-- CORRIGÉ ICI (20 au lieu de 100)
                    disabled={!canClickDone || (currentLesson.questions && currentLesson.questions.length > 0)}
                    className={`px-6 py-3 font-bold rounded-xl transition-all flex items-center gap-2 shrink-0 ${
                      !canClickDone 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : isCurrentLessonCompleted 
                          ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-600'
                          : 'bg-slate-900 text-white hover:bg-blue-600'
                    }`}
                  >
                    {!canClickDone ? (
                      <><span>🔒</span> Vidéo en cours...</>
                    ) : isCurrentLessonCompleted ? (
                      <><span>✓</span> Terminée (Annuler)</>
                    ) : (
                      "Marquer comme terminée"
                    )}
                  </button>
                );
              })()}
            </div>

            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {currentLesson ? currentLesson.content : course.description}
            </p>
              {/* ================= SECTION QUIZ ÉTAPE PAR ÉTAPE ================= */}
            {currentLesson?.questions && currentLesson.questions.length > 0 && (
              <div className="mt-12 pt-8 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl">📝</div>
                  <h3 className="text-2xl font-bold text-slate-900">Quiz de validation</h3>
                </div>

                {!quizFinished ? (
                  // L'ÉTUDIANT EST EN TRAIN DE JOUER
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm">
                    {/* Barre de progression du quiz */}
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                        Question {currentQuestionIndex + 1} sur {currentLesson.questions.length}
                      </span>
                      <span className="text-sm font-bold text-slate-400">Score: {score}</span>
                    </div>

                    {/* Affichage de la question avec le BON nom de colonne */}
                    <h4 className="text-xl font-bold text-slate-900 mb-8">
                      {currentLesson.questions[currentQuestionIndex].questionText}
                    </h4>
                    
                    <div className="space-y-4">
                      {currentLesson.questions[currentQuestionIndex].options.map((option, optIdx) => {
                        const currentQ = currentLesson.questions[currentQuestionIndex];
                        const isSelected = selectedOption === optIdx;
                        const isCorrect = currentQ.correctAnswer === optIdx;
                        
                        // Logique des couleurs en temps réel
                        let buttonStyle = "border-slate-300 hover:border-indigo-600 hover:bg-indigo-50 text-slate-700 bg-white";
                        
                        if (isAnswered) {
                          if (isCorrect) {
                            buttonStyle = "border-green-500 bg-green-50 text-green-700 font-bold shadow-md"; // Toujours vert si c'est la bonne réponse
                          } else if (isSelected && !isCorrect) {
                            buttonStyle = "border-red-500 bg-red-50 text-red-700 font-bold"; // Rouge si on a cliqué sur la mauvaise
                          } else {
                            buttonStyle = "border-slate-200 bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed"; // Grisé
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(optIdx)}
                            disabled={isAnswered}
                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${buttonStyle}`}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0
                              ${isAnswered && isCorrect ? 'border-green-500 bg-green-500' : 
                                isAnswered && isSelected && !isCorrect ? 'border-red-500 bg-red-500' :
                                'border-slate-300 bg-white'}`}>
                              {(isAnswered && isCorrect) ? <span className="text-white text-xs font-bold">✓</span> : 
                               (isAnswered && isSelected && !isCorrect) ? <span className="text-white text-xs font-bold">✗</span> : null}
                            </div>
                            <span className="text-lg">{option}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Bouton Suivant (S'affiche uniquement quand il a répondu) */}
                    {isAnswered && (
                      <div className="mt-8 flex justify-end animate-in fade-in slide-in-from-bottom-2">
                        <button 
                          onClick={handleNextQuestion}
                          className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors shadow-lg flex items-center gap-2"
                        >
                          {currentQuestionIndex < currentLesson.questions.length - 1 ? "Question suivante →" : "Voir mon résultat 🏆"}
                        </button>
                      </div>
                    )}
                  </div>

                ) : (
                      <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center shadow-lg">
                        <div className="text-6xl mb-6">
                          {savedScoreOn20 === 20 ? "🏆" : savedScoreOn20 >= 10 ? "👍" : "😅"}
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2">Quiz Terminé !</h3>
                        <p className="text-lg text-slate-500 mb-8">
                          Note sauvegardée : <span className="font-bold text-indigo-600 text-2xl ml-2">{savedScoreOn20} / 20</span>
                        </p>

                        {savedScoreOn20 >= 10 ? (
                          <div className="p-4 bg-green-100 text-green-700 rounded-xl font-bold mb-8">
                            Félicitations, ce chapitre est validé !
                          </div>
                        ) : (
                          <div className="p-4 bg-amber-100 text-amber-700 rounded-xl font-bold mb-8">
                            Il faut la moyenne (10/20) pour valider !
                          </div>
                        )}

                        <button 
                          onClick={handleRetryQuiz}
                          className="px-8 py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
                        >
                          ↻ Recommencer pour améliorer ma note
                        </button>
                      </div>
                    )}
              </div>
            )}
            {/* ================= FIN DU QUIZ ================= */}
            

            {/* BOUTONS PRÉCÉDENT / SUIVANT */}
            <div className="flex items-center justify-between pt-6 mt-8 border-t border-slate-100">
              <button 
                onClick={() => setCurrentLesson(prevLesson)}
                disabled={!prevLesson}
                className={`px-5 py-2.5 font-bold rounded-xl transition-all flex items-center gap-2 ${
                  prevLesson 
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
              >
                <span>←</span> Chapitre précédent
              </button>

              <button 
                onClick={() => setCurrentLesson(nextLesson)}
                /* NOUVEAU : Le bouton est désactivé si pas de leçon suivante OU si leçon actuelle non terminée */
                disabled={!nextLesson || !isCurrentLessonCompleted}
                className={`px-5 py-2.5 font-bold rounded-xl transition-all flex items-center gap-2 ${
                  (nextLesson && isCurrentLessonCompleted)
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                }`}
                title={!isCurrentLessonCompleted ? "Terminez cette leçon pour débloquer la suite" : ""}
              >
                Chapitre suivant <span>→</span>
              </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* SOMMAIRE DES LEÇONS (À droite) */}
        <aside className="lg:col-span-4 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Contenu du cours</h3>
              <p className="text-sm text-slate-500">{completedLessons} / {course.lessons.length} leçons</p>
            </div>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
            {course.lessons.length === 0 ? (
              <p className="p-6 text-slate-500 text-center text-sm">L'instructeur n'a pas encore ajouté de leçons.</p>
            ) : (
              course.lessons.map((lesson, index) => {
                const isActive = currentLesson?.id === lesson.id;
                const isDone = lesson.progresses && lesson.progresses.length > 0;
                
                // NOUVELLE LOGIQUE : Une leçon est bloquée si ce n'est pas la première 
                // ET que la leçon précédente n'est pas terminée.
                const previousLesson = index > 0 ? course.lessons[index - 1] : null;
                const isLocked = previousLesson && (!previousLesson.progresses || previousLesson.progresses.length === 0);
                
                return (
                  <button
                    key={lesson.id}
                    // Le clic ne fonctionne que si la leçon n'est pas bloquée
                    onClick={() => !isLocked && setCurrentLesson(lesson)}
                    disabled={isLocked}
                    className={`w-full text-left p-4 flex items-center gap-4 transition-colors border-b border-slate-50 last:border-0
                      ${isActive ? 'bg-blue-50/50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}
                      ${isLocked ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50'}
                    `}
                  >
                    {/* ICONE : Coche verte, Cadenas gris, ou Cercle vide */}
                    <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors
                      ${isDone ? 'bg-green-500 border-green-500 text-white' : 
                        isLocked ? 'border-slate-300 text-slate-400 bg-slate-200' : 
                        'border-slate-300 text-transparent'}`}>
                      <span className="text-xs font-bold">
                        {isDone ? '✓' : isLocked ? '🔒' : ''}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 font-bold mb-0.5">Leçon {lesson.order}</p>
                      <h4 className={`font-medium text-sm line-clamp-2 ${isActive ? 'text-blue-700 font-bold' : 'text-slate-700'}`}>
                        {lesson.title}
                      </h4>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          
          {/* BOUTON EXAMEN FINAL (Débloqué si toutes les leçons sont faites) */}
          {!validationResult && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 mt-auto shrink-0">
              <button 
                onClick={() => setShowFinalExam(true)}
                disabled={completedLessons < course.lessons.length}
                className={`w-full py-4 font-black rounded-xl shadow-lg transition-all ${
                  completedLessons < course.lessons.length 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : showFinalExam 
                    ? 'bg-purple-700 text-white ring-4 ring-purple-300' 
                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:-translate-y-1'
                }`}
              >
                {completedLessons < course.lessons.length ? '🔒 Terminez les vidéos' : 'Passer l\'Examen Final 🎓'}
              </button>
            </div>
          )}

        </aside>

      </main>
    </div>
  );
}