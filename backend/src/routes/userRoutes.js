const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isInstructor } = require('../middlewares/authMiddleware');

// 1. Route pour les informations générales
router.put('/profile', verifyToken, userController.updateProfile);

// 2. Route pour la sécurité (Mot de passe)
router.put('/password', verifyToken, userController.updatePassword);

router.get('/pending', verifyToken, isInstructor, userController.getPendingUsers);
router.put('/review', verifyToken, isInstructor, userController.reviewUser);

// Route pour modifier le secteur (Réservé aux instructeurs)
router.put('/:userId/sector', verifyToken, isInstructor, userController.updateUserSector);

module.exports = router;