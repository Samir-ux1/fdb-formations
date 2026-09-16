const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Définition des routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Route pour vérifier l'email (c'est une requête GET car on clique sur un lien)
router.get('/verify-email', authController.verifyEmail);

module.exports = router;