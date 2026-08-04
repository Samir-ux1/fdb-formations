const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. Configurer la connexion à PostgreSQL (Nouveauté Prisma 7)
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);

// 2. Initialiser Prisma avec l'adaptateur
const prisma = new PrismaClient({ adapter });

// --- INSCRIPTION (REGISTER) ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // 1. Vérifier si l'utilisateur existe déjà
    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // 2. Crypter le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Créer l'utilisateur dans la base de données
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'STUDENT' // Rôle par défaut : STUDENT
      }
    });

    res.status(201).json({ message: "Utilisateur créé avec succès !", userId: newUser.id });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'inscription.", error: error.message });
  }
};

// --- CONNEXION (LOGIN) ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Chercher l'utilisateur
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect." });
    }

    // 2. Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect." });
    }

    // 3. Générer le Token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role }, // Les données à cacher dans le token
      process.env.JWT_SECRET,               // La clé secrète du .env
      { expiresIn: '24h' }                  // Le token expire dans 24h
    );

    res.status(200).json({ 
      message: "Connexion réussie !", 
      token, 
      user: { id: user.id, name: user.name, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la connexion.", error: error.message });
  }
};