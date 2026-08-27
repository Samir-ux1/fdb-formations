const express = require('express');
const cors = require('cors');
const userRoutes = require('./src/routes/userRoutes');
require('dotenv').config();

// Initialisation de l'application
const app = express();

const fs = require('fs');
const path = require('path');

// Crée le dossier "uploads" s'il n'existe pas
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Rend le dossier "uploads" accessible et FORCE l'affichage des PDF dans le navigateur
app.use('/uploads', express.static(uploadDir, {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline'); // 'inline' = afficher dans la page !
    }
  }
}));

// Middlewares
app.use(cors()); // Autorise ton Frontend React à communiquer avec ce Backend
app.use(express.json()); // Permet de lire les données JSON (formulaires)

// Importation des routes
const authRoutes = require('./src/routes/authRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes'); 

// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: "🚀 Bienvenue sur l'API de la plateforme de formation !" });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});