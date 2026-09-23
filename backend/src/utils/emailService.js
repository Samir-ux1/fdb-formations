const nodemailer = require('nodemailer');

// Configuration du transporteur d'email (Utilisation de Gmail pour ton PFA)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Ton adresse Gmail
    pass: process.env.EMAIL_PASS  // Ton mot de passe d'application Gmail
  }
});

// Fonction pour envoyer l'email de vérification
exports.sendVerificationEmail = async (userEmail, userName, token) => {
  const verifyUrl = `http://localhost:5173/verify-email?token=${token}`;
  
  const mailOptions = {
    from: '"Toyota Material Handling" <tonemail@gmail.com>',
    to: userEmail,
    subject: 'Action Requise : Vérifiez votre adresse email',
    html: `
      <h2>Bienvenue ${userName} !</h2>
      <p>Votre compte a été créé avec succès. Pour des raisons de sécurité, veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :</p>
      <a href="${verifyUrl}" style="padding: 10px 20px; background-color: #E3000F; color: white; text-decoration: none; border-radius: 4px;">Vérifier mon compte</a>
      <p>Une fois vérifié, votre manager pourra approuver votre accès.</p>
    `
  };

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