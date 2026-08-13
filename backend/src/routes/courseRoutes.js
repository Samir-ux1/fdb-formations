const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const lessonController = require('../controllers/lessonController');
const { verifyToken, isInstructor } = require('../middlewares/authMiddleware');

// 1. ROUTES GLOBALES (Pas d'ID spécifique)
router.get('/', courseController.getAllCourses);
router.post('/', verifyToken, isInstructor, courseController.createCourse);
router.get('/my-courses', verifyToken, courseController.getMyCourses);
router.get('/instructor-courses', verifyToken, isInstructor, courseController.getInstructorCourses);

// 2. ROUTES DU COURS SPÉCIFIQUE
router.get('/:courseId', verifyToken, courseController.getCourseById);
router.put('/:courseId', verifyToken, isInstructor, courseController.updateCourse);
router.delete('/:courseId', verifyToken, isInstructor, courseController.deleteCourse);
router.post('/:courseId/unlock', verifyToken, courseController.unlockCourse);

// 3. ROUTES DES NOTES ET EXAMENS
router.post('/:courseId/grades', verifyToken, courseController.submitGrades); // <-- Corrige le 404 de la soumission
router.post('/:courseId/exam-questions', verifyToken, isInstructor, courseController.addExamQuestion);
router.delete('/:courseId/exam-questions/:questionId', verifyToken, isInstructor, courseController.deleteExamQuestion); // <-- Corrige l'erreur de suppression

// 4. ROUTES DES LEÇONS
router.post('/:courseId/lessons', verifyToken, isInstructor, lessonController.addLesson);
router.put('/:courseId/lessons/:lessonId', verifyToken, isInstructor, lessonController.updateLesson);
router.delete('/:courseId/lessons/:lessonId', verifyToken, isInstructor, lessonController.deleteLesson);
router.post('/:courseId/lessons/:lessonId/progress', verifyToken, lessonController.toggleProgress);
// NOUVEAU : Routes pour les questions de quiz de chapitres
router.post('/:courseId/lessons/:lessonId/questions', verifyToken, isInstructor, lessonController.addLessonQuestion);
router.delete('/:courseId/lessons/:lessonId/questions/:questionId', verifyToken, isInstructor, lessonController.deleteLessonQuestion);


// Routes pour les étudiants
router.get('/:courseId/students', verifyToken, isInstructor, courseController.getCourseStudents);
router.post('/:courseId/students/:studentId/reset', verifyToken, isInstructor, courseController.resetStudentProgress);
// CETTE LIGNE DOIT TOUJOURS ÊTRE LA TOUTE DERNIÈRE !
module.exports = router;