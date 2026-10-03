const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // Plus sûr que de taper le host manuellement
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Fonction pour envoyer l'email de vérification
exports.sendVerificationEmail = async (userEmail, userName, token) => {
  const frontendUrl = process.env.FRONTEND_URL || (process.env.VERCEL
    ? 'https://fdb-formations-4iqs-tau.vercel.app'
    : 'http://localhost:5173');
  const verifyUrl = `${frontendUrl.replace(/\/+$/, '')}/verify-email?token=${encodeURIComponent(token)}`;
  
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

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[character]));

// Rappel avant échéance ou relance après échéance.
exports.sendReminderEmail = async (userEmail, userName, courseTitle, deadline, courseId, isOverdue = false) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://fdb-formations-4iqs-tau.vercel.app';
  const courseUrl = `${frontendUrl.replace(/\/+$/, '')}/courses/${courseId}`;
  const formattedDeadline = new Date(deadline).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Casablanca'
  });
  const safeName = escapeHtml(userName || 'Technicien');
  const safeTitle = escapeHtml(courseTitle || 'votre formation');
  const subject = isOverdue
    ? '⚠️ Votre formation a dépassé sa date limite'
    : '⚠️ Il vous reste moins de 2 jours pour terminer votre formation';

  const mailOptions = {
    from: `"Toyota Formations" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111827">
        <h2>Bonjour ${safeName},</h2>
        ${isOverdue
          ? `<p>La date limite de votre formation <strong>${safeTitle}</strong> est dépassée depuis le <strong>${formattedDeadline}</strong>.</p><p>Votre formation reste accessible. Contactez votre formateur pour convenir de la suite.</p>`
          : `<p>La date limite de votre formation <strong>${safeTitle}</strong> approche : <strong>${formattedDeadline}</strong>. Il vous reste moins de 48 heures pour terminer les chapitres et passer l’évaluation.</p>`}
        <p><a href="${courseUrl}" style="display:inline-block;padding:12px 20px;background:#EB0A1E;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Reprendre la formation</a></p>
      </div>
    `
  };
  await transporter.sendMail(mailOptions);
};
