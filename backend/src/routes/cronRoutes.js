const express = require('express');
const { runDeadlineReminders } = require('../cron/reminderJob');

const router = express.Router();

router.get('/deadlines', async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(503).json({ message: 'CRON_SECRET is not configured.' });
  if (req.get('authorization') !== `Bearer ${secret}`) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  try {
    const result = await runDeadlineReminders();
    return res.status(200).json({ message: 'Deadline reminders processed.', ...result });
  } catch (error) {
    console.error('[CRON] Deadline reminder job failed:', error);
    return res.status(500).json({ message: 'Unable to process deadline reminders.' });
  }
});

module.exports = router;
