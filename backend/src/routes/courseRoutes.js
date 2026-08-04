const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const lessonController = require('../controllers/lessonController');
const { verifyToken, isInstructor } = require('../middlewares/authMiddleware');

// 1. Routes globales
router.get('/', courseController.getAllCourses);
router.post('/', verifyToken, isInstructor, courseController.createCourse);
router.get('/my-courses', verifyToken, courseController.getMyCourses);
router.get('/instructor-courses', verifyToken, isInstructor, courseController.getInstructorCourses);

// 2. Routes des Leçons (CRUD)
router.post('/:courseId/lessons', verifyToken, isInstructor, lessonController.addLesson);
router.put('/:courseId/lessons/:lessonId', verifyToken, isInstructor, lessonController.updateLesson);
router.delete('/:courseId/lessons/:lessonId', verifyToken, isInstructor, lessonController.deleteLesson);
router.post('/:courseId/lessons/:lessonId/progress', verifyToken, lessonController.toggleProgress);

// 3. Routes des Quiz (Questions) - C'est ici qu'était le problème !
router.post('/:courseId/lessons/:lessonId/questions', verifyToken, isInstructor, lessonController.addQuestion);
router.delete('/:courseId/lessons/:lessonId/questions/:questionId', verifyToken, isInstructor, lessonController.deleteQuestion);

// 4. Routes spécifiques à un cours
router.get('/:courseId', verifyToken, courseController.getCourseById);
router.put('/:courseId', verifyToken, isInstructor, courseController.updateCourse);
router.delete('/:courseId', verifyToken, isInstructor, courseController.deleteCourse);
router.post('/:courseId/unlock', verifyToken, courseController.unlockCourse);

router.post('/:courseId/validate', verifyToken, courseController.validateCourse);

// TOUJOURS À LA FIN :
module.exports = router;