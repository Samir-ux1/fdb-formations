const cron = require('node-cron');
const prisma = require('../config/prisma');
const emailService = require('../utils/emailService');

// Ce robot tourne tous les jours à 08:00 du matin ('0 8 * * *')
const startCronJobs = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log("🤖 [CRON] Vérification des formations en cours...");

    try {
      // 1. Récupère toutes les inscriptions "En cours" avec une date limite
      const activeEnrollments = await prisma.enrollment.findMany({
        where: { status: 'IN_PROGRESS' },
        include: { user: true, course: true }
      });

      for (let enrollment of activeEnrollments) {
        if (!enrollment.course.timeLimitDays) continue;

        // 2. Calcul des dates
        const startDate = new Date(enrollment.createdAt);
        const deadline = new Date(startDate.getTime() + enrollment.course.timeLimitDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        
        // Jours restants
        const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

        // 3. ACTION : S'il reste exactement 2 jours
        if (diffDays === 2) {
          console.log(`📧 Envoi du rappel (J-2) à ${enrollment.user.email}`);
          await emailService.sendReminderEmail(enrollment.user.email, enrollment.user.name, enrollment.course.title);
        }
        
        // 4. ACTION : Si la date est dépassée (Temps écoulé)
        else if (diffDays <= 0) {
          console.log(`❌ Expiration de la formation pour ${enrollment.user.email}`);
          
          // On passe l'étudiant en échec (FAILED)
          await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { status: 'FAILED' }
          });

          // On lui envoie le mail d'expiration
          await emailService.sendExpiredEmail(enrollment.user.email, enrollment.user.name, enrollment.course.title);
        }
      }
    } catch (error) {
      console.error("Erreur dans le Cron Job :", error);
    }
  });
};

module.exports = startCronJobs;