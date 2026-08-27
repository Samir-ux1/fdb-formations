const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 1. Route pour les informations générales
router.put('/profile', verifyToken, userController.updateProfile);

// 2. Route pour la sécurité (Mot de passe)
router.put('/password', verifyToken, userController.updatePassword);

module.exports = router;