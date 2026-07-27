const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

exports.addLesson = async (req, res) => {
  try {
    const { title, content, videoUrl, order } = req.body;
    const courseId = parseInt(req.params.courseId);

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== req.user.userId) return res.status(403).json({ message: "Accès refusé." });

    const newLesson = await prisma.lesson.create({
      data: { title, content, videoUrl, order: parseInt(order), courseId }
    });
    res.status(201).json({ message: "Leçon ajoutée !", lesson: newLesson });
  } catch (error) {
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const lessonId = parseInt(req.params.lessonId);
    const { title, content, videoUrl, order } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.instructorId !== req.user.userId) return res.status(403).json({ message: "Accès refusé." });

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: { title, content, videoUrl, order: parseInt(order) }
    });
    res.status(200).json({ message: "Leçon modifiée !", lesson: updatedLesson });
  } catch (error) {
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

exports.toggleProgress = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const userId = req.user.userId;

    const existingProgress = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } }
    });

    if (existingProgress) {
      await prisma.lessonProgress.delete({ where: { id: existingProgress.id } });
      return res.status(200).json({ completed: false });
    } else {
      await prisma.lessonProgress.create({ data: { userId, lessonId } });
      return res.status(200).json({ completed: true });
    }
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

// --- LES FONCTIONS DU QUIZ ---
exports.addQuestion = async (req, res) => {
  try {
    const lessonId = parseInt(req.params.lessonId);
    const { questionText, options, correctAnswer } = req.body;

    const newQuestion = await prisma.question.create({
      data: {
        questionText,
        options,
        correctAnswer: parseInt(correctAnswer),
        lessonId
      }
    });
    res.status(201).json({ message: "Question ajoutée !", question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    await prisma.question.delete({ where: { id: questionId } });
    res.status(200).json({ message: "Question supprimée." });
  } catch (error) {
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};