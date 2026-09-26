const nodemailer = require('nodemailer');

// Configuration optimisée et sécurisée pour Vercel
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // On force l'utilisation du serveur SMTP officiel
  port: 465,              // Port sécurisé
  secure: true,           // Obligatoire pour le port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  pool: false // Empêche Vercel de garder la connexion ouverte (ce qui causait le bug !)
});

// Fonction pour envoyer l'email de vérification
exports.sendVerificationEmail = async (userEmail, userName, token) => {
  
  // 1. CORRECTION DU LIEN : On met la VRAIE adresse de votre plateforme en ligne
  const verifyUrl = `https://fdb-formations-4iqs-tau.vercel.app/verify-email?token=${token}`;
  
  const mailOptions = {
    // 2. CORRECTION DU SPAM : On utilise votre VRAIE variable d'email
    from: `"Toyota Learning Hub" <${process.env.EMAIL_USER}>`, 
    to: userEmail,
    subject: 'Action Requise : Vérifiez votre adresse email',
    html: `
      <div style="font-family: Arial, sans-serif; max-w-md; margin: auto;">
        <h2>Bienvenue ${userName} !</h2>
        <p>Votre compte a été créé avec succès. Pour des raisons de sécurité, veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :</p>
        <br/>
        <a href="${verifyUrl}" style="padding: 12px 24px; background-color: #EB0A1E; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Vérifier mon compte
        </a>
        <br/><br/>
        <p>Une fois vérifié, votre manager pourra approuver votre accès aux modules techniques.</p>
      </div>
    `
  };

  // 3. On attend bien la fin de l'envoi
  return await transporter.sendMail(mailOptions);
};

// Fonction pour le rappel des 2 jours restants
exports.sendReminderEmail = async (userEmail, userName, courseTitle) => {
  const mailOptions = {
    from: '"Toyota Formations" <tonemail@gmail.com>',
    to: userEmail,
    subject: '⚠️ Alerte : Plus que 2 jours pour valider votre formation !',
    html: `
      <h2>Bonjour ${userName},</h2>
      <p>Ceci est un rappel automatique. Il vous reste exactement <strong>2 jours</strong> pour terminer votre module <strong>"${courseTitle}"</strong> et passer l'examen final.</p>
      <p>Ne tardez pas, passé ce délai, votre accès sera bloqué.</p>
    `
  };
  await transporter.sendMail(mailOptions);
};

// Fonction quand la formation est expirée
exports.sendExpiredEmail = async (userEmail, userName, courseTitle) => {
  const mailOptions = {
    from: '"Toyota Formations" <tonemail@gmail.com>',
    to: userEmail,
    subject: '❌ Temps écoulé pour votre formation',
    html: `
      <h2>Bonjour ${userName},</h2>
      <p>Le délai imparti pour terminer le module <strong>"${courseTitle}"</strong> est dépassé.</p>
      <p>Votre statut est désormais "En Échec". Veuillez contacter votre administrateur RH pour demander une seconde chance.</p>
    `
  };
  await transporter.sendMail(mailOptions);
};