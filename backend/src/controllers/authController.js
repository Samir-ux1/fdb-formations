const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../utils/emailService');

// --- INSCRIPTION (REGISTER) ---
exports.register = async (req, res) => {
  console.log("👉 [1] Début inscription pour :", req.body.email);
  try {
    const { name, email, password, role } = req.body;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      console.log("❌ [ERREUR] L'email existe déjà dans la base !");
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await prisma.user.create({
      data: {
        name, 
        email, 
        password: hashedPassword,
        role: role || 'STUDENT',
        status: 'PENDING',
        verificationToken
      }
    });
    console.log("✅ [2] Compte créé avec succès dans PostgreSQL !");

    // On force Vercel à s'arrêter et à attendre l'envoi de l'email
    try {
      await emailService.sendVerificationEmail(newUser.email, newUser.name, verificationToken);
      console.log("📧 [3] Email de vérification envoyé à Google !");
    } catch (emailError) {
      console.error("⚠️ [ERREUR EMAIL] L'envoi a échoué :", emailError.message);
      // On répond quand même 201 pour ne pas bloquer l'étudiant, mais on le signale
      return res.status(201).json({ message: "Compte créé, mais l'envoi de l'email a échoué. Contactez le formateur." });
    }

    console.log("🚀 [4] Réponse 201 envoyée au Frontend !");
    return res.status(201).json({ message: "Inscription réussie." });

  } catch (error) {
    console.error("🔥 [ERREUR FATALE] :", error);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};

exports.login = async (req, res) => {
  console.log("👉 Tentative de connexion pour :", req.body.email);
  
  try {
    const { email, password } = req.body;

    // 1. Chercher l'utilisateur
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("❌ ERREUR : Utilisateur non trouvé dans la base.");
      return res.status(401).json({ message: "Adresse email introuvable." });
    }

    // 2. Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("❌ ERREUR : Mot de passe incorrect.");
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    // 3. Créer le Token (Vérifier si JWT_SECRET existe)
    if (!process.env.JWT_SECRET) {
      console.error("🔥 ERREUR FATALE : JWT_SECRET manquant sur Vercel !");
      return res.status(500).json({ message: "Erreur de configuration serveur (JWT)." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' } // Valable 7 jours
    );

    console.log("✅ Connexion réussie !");
    return res.status(200).json({ token, user });

  } catch (error) {
    console.error("🔥 ERREUR FATALE LORS DU LOGIN :", error);
    return res.status(500).json({ message: "Erreur critique du serveur.", error: error.message });
  }
};

// --- VÉRIFICATION DE L'EMAIL ---
exports.verifyEmail = async (req, res) => {
  console.log("👉 Demande de vérification reçue pour le token :", req.body.token);

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Aucun token fourni." });
    }

    // 1. Chercher l'utilisateur qui possède ce token exact dans la BDD
    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    // 2. Si on ne trouve personne, c'est que le lien est faux ou a déjà été cliqué
    if (!user) {
      console.log("❌ Token introuvable ou déjà utilisé.");
      return res.status(400).json({ message: "Lien de vérification invalide ou expiré." });
    }

    // 3. Mettre à jour l'utilisateur !
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'VERIFIED', // L'email est validé (il attend maintenant l'approbation du formateur)
        verificationToken: null // On supprime le token pour qu'il ne soit pas réutilisable !
      }
    });

    console.log("✅ Email vérifié avec succès pour :", user.email);
    return res.status(200).json({ message: "Email vérifié avec succès !" });

  } catch (error) {
    console.error("🔥 Erreur lors de la vérification :", error);
    return res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};