const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const lessonController = require('../controllers/lessonController'); // Nouvel import
const { verifyToken, isInstructor } = require('../middlewares/authMiddleware');

// Routes des formations
router.get('/', courseController.getAllCourses);
router.post('/', verifyToken, isInstructor, courseController.createCourse);

// Route : Obtenir les formations de l'étudiant (À METTRE AVANT /:courseId/unlock)
router.get('/my-courses', verifyToken, courseController.getMyCourses);

// Obtenir les cours créés par un instructeur
router.get('/instructor-courses', verifyToken, isInstructor, courseController.getInstructorCourses);

// Nouvelle Route : Ajouter une leçon à un cours spécifique (ex: cours n°1)
router.post('/:courseId/lessons', verifyToken, isInstructor, lessonController.addLesson);

// Route pour cocher/décocher une leçon
router.post('/:courseId/lessons/:lessonId/progress', verifyToken, lessonController.toggleProgress);

router.put('/:courseId/lessons/:lessonId', verifyToken, isInstructor, lessonController.updateLesson);

router.delete('/:courseId/lessons/:lessonId', verifyToken, isInstructor, lessonController.deleteLesson);

// Routes pour les Quiz (Questions)
router.post('/:courseId/lessons/:lessonId/questions', verifyToken, isInstructor, lessonController.addQuestion);
router.delete('/:courseId/lessons/:lessonId/questions/:questionId', verifyToken, isInstructor, lessonController.deleteQuestion);

// Nouvelle Route : Débloquer une formation (avec la clé)
router.post('/:courseId/unlock', verifyToken, courseController.unlockCourse);

// Route : Obtenir un cours spécifique et ses leçons
router.get('/:courseId', verifyToken, courseController.getCourseById);

// Routes pour modifier et supprimer la formation entière
router.put('/:courseId', verifyToken, isInstructor, courseController.updateCourse);
router.delete('/:courseId', verifyToken, isInstructor, courseController.deleteCourse);

module.exports = router;