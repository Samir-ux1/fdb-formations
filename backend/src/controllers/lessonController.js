const prisma = require('../config/prisma');

// --- AJOUTER UNE LEÇON ---
exports.addLesson = async (req, res) => {
  try {
    // 1. On s'assure de bien récupérer quizQuestionCount
    const { title, content, videoUrl, pdfUrl, order, quizQuestionCount, quizEasyQuestionCount = 0, quizMediumQuestionCount = 0, quizHardQuestionCount = 0 } = req.body;
    const courseId = parseInt(req.params.courseId);

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } });
    if (!course) return res.status(404).json({ message: 'Formation introuvable.' });
    if (req.user.role !== 'ADMIN' && course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }

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
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { instructorId: true } });
    const existingLesson = await prisma.lesson.findFirst({ where: { id: lessonId, courseId } });
    if (!course || !existingLesson) return res.status(404).json({ message: 'Leçon introuvable.' });
    if (req.user.role !== 'ADMIN' && course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    
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
    const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, courseId } });
    if (!course || !lesson) return res.status(404).json({ message: 'Leçon introuvable.' });
    if (req.user.role !== 'ADMIN' && course.instructorId !== req.user.userId) return res.status(403).json({ message: "Accès refusé." });

    await prisma.lesson.delete({ where: { id: lesson.id } });
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
    const courseId = Number.parseInt(req.params.courseId, 10);
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { courseId: true, questions: { select: { id: true } } }
    });
    if (!lesson || lesson.courseId !== courseId) return res.status(404).json({ message: 'Leçon introuvable.' });
    if (lesson.questions.length) return res.status(400).json({ message: 'Les quiz doivent être soumis via le correcteur sécurisé.' });
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: lesson.courseId } },
      select: { status: true }
    });
    if (!enrollment) return res.status(403).json({ message: 'Vous devez être inscrit à cette formation.' });
    if (enrollment.status !== 'IN_PROGRESS') return res.status(403).json({ message: 'Cette formation n’est plus accessible.' });
    const progress = await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: { userId, lessonId, score: 20 },
      update: { score: 20 },
      select: { score: true }
    });
    return res.status(200).json({ completed: true, score: progress.score });
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
