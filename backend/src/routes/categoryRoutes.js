const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, isInstructor } = require('../middlewares/authMiddleware');

router.get('/', categoryController.getCategories);
router.post('/', verifyToken, isInstructor, categoryController.createCategory);

router.put('/:id', verifyToken, isInstructor, categoryController.updateCategory);
router.delete('/:id', verifyToken, isInstructor, categoryController.deleteCategory);

module.exports = router;