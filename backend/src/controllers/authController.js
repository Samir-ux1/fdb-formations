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

// --- CONNEXION (LOGIN) ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect." });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Email ou mot de passe incorrect." });
    }

    // 🛡️ NIVEAU 1 : L'utilisateur a-t-il vérifié son email ?
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Veuillez d'abord vérifier votre adresse email en cliquant sur le lien que nous vous avons envoyé." });
    }

    // 🛡️ NIVEAU 2 : L'administrateur a-t-il approuvé le compte ?
    if (user.status === 'PENDING') {
      return res.status(403).json({ message: "Votre email est vérifié ! Votre compte est actuellement en cours d'approbation par le manager." });
    }
    if (user.status === 'REJECTED') {
      return res.status(403).json({ message: "Votre demande d'accès a été refusée." });
    }

    // Si tout est bon, on génère le token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ message: "Connexion réussie !", token, user });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
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