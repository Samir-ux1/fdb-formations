const express = require('express');
const cors = require('cors');
require('dotenv').config();
const prisma = require('./src/config/prisma');
const userRoutes = require('./src/routes/userRoutes');
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

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:5173', // Pour continuer à tester sur votre PC
    'https://fdb-formations-4iqs-tau.vercel.app' // L'URL exacte de votre Frontend sur Vercel !
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // Autorise l'envoi du Token
}));
app.use(express.json()); // Permet de lire les données JSON (formulaires)

// Importation des routes
const authRoutes = require('./src/routes/authRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes'); 
const cronRoutes = require('./src/routes/cronRoutes');

// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cron', cronRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: "🚀 Bienvenue sur l'API de la plateforme de formation !" });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});

// ==========================================
// ROUTES POUR GÉRER LES SECTEURS DYNAMIQUES
// ==========================================
app.get('/api/sectors', async (req, res) => {
  try {
    const sectors = await prisma.sector.findMany({ orderBy: { name: 'asc' } });
    res.json(sectors);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/sectors', async (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  if (!name) {
    return res.status(400).json({ message: "Le nom du secteur est obligatoire." });
  }

  try {
    const newSector = await prisma.sector.create({ data: { name } });
    res.status(201).json(newSector);
  } catch (error) {
    console.error("Erreur lors de l'ajout du secteur :", error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: "Un secteur portant ce nom existe déjà." });
    }
    return res.status(500).json({ message: "Impossible d'ajouter le secteur." });
  }
});

app.delete('/api/sectors/:id', async (req, res) => {
  try {
    await prisma.sector.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: "Secteur supprimé" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = app;
