const prisma = require('../config/prisma');

// --- AJOUTER UNE LEÇON ---
exports.addLesson = async (req, res) => {
  try {
    // 1. On s'assure de bien récupérer quizQuestionCount
    const { title, content, videoUrl, pdfUrl, order, quizQuestionCount, quizEasyQuestionCount = 0, quizMediumQuestionCount = 0, quizHardQuestionCount = 0 } = req.body;
    const courseId = parseInt(req.params.courseId);

    const newLesson = await prisma.lesson.create({
      data: {
        title,
        content: content || null,
        videoUrl: videoUrl || null,
        pdfUrl: pdfUrl || null, 
        order: parseInt(order) || 1,
        // 2. Conversion sécurisée (0 par défaut si c'est vide)
        quizQuestionCount: parseInt(quizQuestionCount) || 0, 
        quizEasyQuestionCount: Math.max(0, parseInt(quizEasyQuestionCount, 10) || 0),
        quizMediumQuestionCount: Math.max(0, parseInt(quizMediumQuestionCount, 10) || 0),
        quizHardQuestionCount: Math.max(0, parseInt(quizHardQuestionCount, 10) || 0),
        courseId
      }
    });
    res.status(201).json({ message: "Leçon ajoutée !", lesson: newLesson });
  } catch (error) {
    console.error("Erreur AddLesson :", error);
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};

// --- MODIFIER UNE LEÇON ---
exports.updateLesson = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const lessonId = parseInt(req.params.lessonId);
    
    // 1. On s'assure de bien récupérer quizQuestionCount ICI AUSSI
    const { title, content, videoUrl, pdfUrl, order, quizQuestionCount, quizEasyQuestionCount = 0, quizMediumQuestionCount = 0, quizHardQuestionCount = 0 } = req.body;

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: { 
        title, 
        content: content || null, 
        videoUrl: videoUrl || null, 
        pdfUrl: pdfUrl || null, 
        order: parseInt(order) || 1,
        // 2. Mise à jour sécurisée du nombre de questions
        quizQuestionCount: parseInt(quizQuestionCount) || 0,
        quizEasyQuestionCount: Math.max(0, parseInt(quizEasyQuestionCount, 10) || 0),
        quizMediumQuestionCount: Math.max(0, parseInt(quizMediumQuestionCount, 10) || 0),
        quizHardQuestionCount: Math.max(0, parseInt(quizHardQuestionCount, 10) || 0)
      }
    });
    res.status(200).json({ message: "Leçon modifiée !", lesson: updatedLesson });
  } catch (error) {
    console.error("Erreur UpdateLesson :", error); // <-- Aichera la vraie erreur dans le terminal VS Code
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const lessonId = parseInt(req.params.lessonId);

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== req.user.userId) return res.status(403).json({ message: "Accès refusé." });

    await prisma.lesson.delete({ where: { id: lessonId } });
    res.status(200).json({ message: "Leçon supprimée." });
  } catch (error) {
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};

// --- SAUVEGARDER OU ANNULER UNE LEÇON (AVEC MÉMOIRE DU SCORE) ---
exports.toggleProgress = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const userId = req.user.userId;
    const { score } = req.body; 

    const existingProgress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } }
    });

    // 1. Si on a DÉJÀ une progression
    if (existingProgress) {
      if (score !== undefined) {
        // S'il refait le quiz, on MET À JOUR sa note (on ne l'efface surtout pas !)
        const newScore = parseFloat(score);
        await prisma.lessonProgress.update({
          where: { id: existingProgress.id },
          data: { score: newScore }
        });
        return res.status(200).json({ completed: true, score: newScore });
      } else {
        // S'il clique sur "Annuler" pour une vidéo simple (sans quiz), on l'efface
        await prisma.lessonProgress.delete({ where: { id: existingProgress.id } });
        return res.status(200).json({ completed: false });
      }
    } 
    // 2. Si c'est la PREMIÈRE FOIS qu'il termine la leçon
    else {
      const newScore = score !== undefined ? parseFloat(score) : 20; // 20/20 par défaut si pas de quiz
      await prisma.lessonProgress.create({ 
        data: { userId, lessonId, score: newScore } 
      });
      return res.status(200).json({ completed: true, score: newScore });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- AJOUTER UNE QUESTION À UNE LEÇON (QUIZ DE CHAPITRE) ---
exports.addLessonQuestion = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const { questionText, options, correctAnswer, difficulty = 'MOYEN' } = req.body;
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, include: { course: { select: { instructorId: true } } } });
    if (!lesson || (req.user.role !== 'ADMIN' && lesson.course.instructorId !== req.user.userId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    if (!['FACILE', 'MOYEN', 'DIFFICILE'].includes(difficulty)) {
      return res.status(400).json({ message: 'Niveau de difficulté invalide.' });
    }
    if (!questionText?.trim() || !Array.isArray(options) || options.length < 2 || options.some(option => typeof option !== 'string' || !option.trim()) || !Number.isInteger(Number(correctAnswer)) || Number(correctAnswer) < 0 || Number(correctAnswer) >= options.length) {
      return res.status(400).json({ message: 'Question, options et réponse correcte invalides.' });
    }

    const newQuestion = await prisma.question.create({
      data: {
        questionText,
        options,
        correctAnswer: parseInt(correctAnswer),
        difficulty,
        lessonId
      }
    });
    res.status(201).json({ message: "Question ajoutée !", question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};

// --- SUPPRIMER UNE QUESTION D'UNE LEÇON ---
exports.deleteLessonQuestion = async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    const question = await prisma.question.findUnique({ where: { id: questionId }, include: { lesson: { include: { course: { select: { instructorId: true } } } } } });
    if (!question || !question.lesson || (req.user.role !== 'ADMIN' && question.lesson.course.instructorId !== req.user.userId)) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    await prisma.question.delete({ where: { id: questionId } });
    res.status(200).json({ message: "Question supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};
