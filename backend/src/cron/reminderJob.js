const prisma = require('../config/prisma');
const emailService = require('../utils/emailService');

const DAY_MS = 24 * 60 * 60 * 1000;

// Called by Vercel Cron; it deliberately does not change enrollment status.
exports.runDeadlineReminders = async () => {
  const now = new Date();
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: 'IN_PROGRESS',
      reminderSentAt: null,
      course: { timeLimitDays: { not: null } }
    },
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { id: true, title: true, timeLimitDays: true } }
    }
  });

  const result = { examined: enrollments.length, sent: 0, failed: 0, skipped: 0 };
  for (const enrollment of enrollments) {
    const deadline = new Date(enrollment.createdAt.getTime() + enrollment.course.timeLimitDays * DAY_MS);
    const remaining = deadline.getTime() - now.getTime();
    if (remaining <= 0 || remaining > 2 * DAY_MS) {
      result.skipped += 1;
      continue;
    }

    // Claim atomically so concurrent cron invocations cannot send duplicates.
    const claim = await prisma.enrollment.updateMany({
      where: { id: enrollment.id, status: 'IN_PROGRESS', reminderSentAt: null },
      data: { reminderSentAt: now }
    });
    if (claim.count !== 1) {
      result.skipped += 1;
      continue;
    }

    try {
      await emailService.sendReminderEmail(
        enrollment.user.email,
        enrollment.user.name,
        enrollment.course.title,
        deadline,
        enrollment.course.id
      );
      result.sent += 1;
    } catch (error) {
      await prisma.enrollment.updateMany({
        where: { id: enrollment.id, reminderSentAt: now },
        data: { reminderSentAt: null }
      });
      result.failed += 1;
      console.error(`[CRON] Échec du rappel pour l'inscription ${enrollment.id}:`, error.message);
    }
  }
  return result;
};
