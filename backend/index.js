const express = require('express');
const cors = require('cors');
const userRoutes = require('./src/routes/userRoutes');
require('dotenv').config();
const startCronJobs = require('./src/cron/reminderJob');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Initialisation de l'application
const app = express();

const fs = require('fs');
const path = require('path');

// 1. Helmet cache les informations de votre serveur aux hackers
app.use(helmet());

// 2. Rate Limit empêche un hacker de tester 1000 mots de passe ou "Clés secrètes" par seconde
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque adresse IP à 100 requêtes toutes les 15 min
  message: "Trop de requêtes, veuillez réessayer plus tard."
});
app.use(limiter);



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

// Configuration CORS Dynamique pour accepter Vercel et Localhost
const corsOptions = {
  origin: function (origin, callback) {
    // Si l'origine n'existe pas (ex: Postman), ou vient de localhost, ou vient de n'importe quel site Vercel
    if (!origin || origin.includes('localhost') || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Bloqué par CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // Autorise l'envoi du Token
};

app.use(cors(corsOptions));

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

// Démarre le robot des emails automatiques
startCronJobs();

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});

module.exports = app;