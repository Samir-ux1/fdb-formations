require('dotenv').config(); // 1. OBLIGATOIRE : On force la lecture du .env en tout premier !

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// 2. On vérifie si on utilise la base en ligne (Neon) ou locale (localhost)
const isOnlineDB = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // 3. On active le SSL uniquement si c'est la base de données en ligne !
  ssl: isOnlineDB ? { rejectUnauthorized: false } : undefined 
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- METTRE À JOUR LE PROFIL ---
// ... (garde ta fonction exports.updateProfile exactement comme elle est en dessous)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone, birthDate, avatarUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        birthDate,
        avatarUrl,
        name: `${firstName} ${lastName}` 
      }
    });

    res.status(200).json({ 
      message: "Profil mis à jour avec succès !", 
      user: { 
        id: updatedUser.id, 
        name: updatedUser.name, 
        firstName: updatedUser.firstName, 
        lastName: updatedUser.lastName, 
        email: updatedUser.email, 
        role: updatedUser.role,
        phone: updatedUser.phone,
        birthDate: updatedUser.birthDate,
        avatarUrl: updatedUser.avatarUrl
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur.", error: error.message });
  }
};

// --- CHANGER LE MOT DE PASSE ---
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    // 1. Récupérer l'utilisateur
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // 2. Vérifier si l'ancien mot de passe est correct
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Le mot de passe actuel est incorrect." });
    }

    // 3. Hacher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Sauvegarder le nouveau mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.status(200).json({ message: "Mot de passe modifié avec succès !" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur.", error: error.message });
  }
};