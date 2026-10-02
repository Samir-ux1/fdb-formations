const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Définition des routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// La page /verify-email du frontend transmet le token au backend en POST.
router.post('/verify-email', authController.verifyEmail);

module.exports = router;
