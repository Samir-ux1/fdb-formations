const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- AJOUTER UNE LEÇON À UNE FORMATION ---
exports.addLesson = async (req, res) => {
  try {
    const { title, content, videoUrl, order } = req.body;
    
    // On récupère l'ID du cours depuis l'URL (ex: /api/courses/1/lessons)
    const courseId = parseInt(req.params.courseId);

    // 1. Vérifier si la formation existe
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: "Formation introuvable." });
    }

    // 2. SÉCURITÉ: Vérifier si l'instructeur connecté est bien le créateur de cette formation
    if (course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: "Vous n'avez pas le droit de modifier cette formation." });
    }

    // 3. Créer la leçon
    const newLesson = await prisma.lesson.create({
      data: {
        title,
        content,
        videoUrl,
        order: order || 1,
        courseId
      }
    });

    res.status(201).json({ message: "Leçon ajoutée avec succès !", lesson: newLesson });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'ajout de la leçon.", error: error.message });
  }
};// --- MODIFIER UNE LEÇON ---
exports.updateLesson = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const lessonId = parseInt(req.params.lessonId);
    const { title, content, videoUrl, order } = req.body;

    // 1. Vérifier si l'instructeur est bien le propriétaire
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    // 2. Mettre à jour la leçon
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: { title, content, videoUrl, order: parseInt(order) }
    });

    res.status(200).json({ message: "Leçon modifiée !", lesson: updatedLesson });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification.", error: error.message });
  }
};

// --- SUPPRIMER UNE LEÇON ---
exports.deleteLesson = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const lessonId = parseInt(req.params.lessonId);

    // 1. Vérifier la propriété
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== req.user.userId) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    // 2. Supprimer
    await prisma.lesson.delete({
      where: { id: lessonId }
    });

    res.status(200).json({ message: "Leçon supprimée avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression.", error: error.message });
  }
};

// --- MARQUER UNE LEÇON COMME TERMINÉE / NON TERMINÉE ---
exports.toggleProgress = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const userId = req.user.userId;

    // On regarde si l'utilisateur a déjà terminé la leçon
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } }
    });

    if (existingProgress) {
      // S'il clique à nouveau, on décoche (supprime la progression)
      await prisma.lessonProgress.delete({ where: { id: existingProgress.id } });
      return res.status(200).json({ completed: false });
    } else {
      // Sinon on valide la leçon
      await prisma.lessonProgress.create({ data: { userId, lessonId } });
      return res.status(200).json({ completed: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- AJOUTER UNE QUESTION À UN QUIZ ---
exports.addQuestion = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const { questionText, options, correctAnswer } = req.body;

    const newQuestion = await prisma.question.create({
      data: {
        questionText,
        options, // ex: ["Paris", "Londres", "Madrid"]
        correctAnswer: parseInt(correctAnswer), // ex: 0
        lessonId
      }
    });

    res.status(201).json({ message: "Question ajoutée !", question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- SUPPRIMER UNE QUESTION ---
exports.deleteQuestion = async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    await prisma.question.delete({ where: { id: questionId } });
    res.status(200).json({ message: "Question supprimée." });
  } catch (error) {
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};