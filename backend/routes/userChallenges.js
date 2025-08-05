/* routes/userChallenges.js */
const express        = require('express');
const router         = express.Router();
const UserChallenge  = require('../models/UserChallenge');
const Challenge      = require('../models/Challenge');          // ← needed for populate
const authMiddleware = require('../middleware/auth');
const { grantCompletionReward } = require('../lib/rewardHelpers');
const { createNotification } = require('../services/notifications');
const ChatMessage = require('../models/ChatMessage');
const verifyToken = require('../middleware/verifyToken');




/* helpers */
const sameDay  = (a, b) => a?.toDateString() === b?.toDateString();
const mapToObj = (m)    => Object.fromEntries(m || []);

/* ───────── GET /api/user-challenges ───────────────────────── */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // 1. get ALL user challenges (not just active), with Challenge populated
    const list = await UserChallenge
      .find({ userId: req.user })
      .populate('challengeId');

    // 2. If the challenge has ended, mark as completed
    const now = new Date();
    const idsToFinish = list
      .filter(uc => uc.status === 'active' && uc.challengeId?.endDate && uc.challengeId.endDate < now)
      .map(uc => uc._id);

    if (idsToFinish.length) {
      await UserChallenge.updateMany(
        { _id: { $in: idsToFinish } },
        { $set: { status: 'completed' } }
      );
    }

    // 3. Re-fetch list after status update
    const freshList = await UserChallenge
      .find({ userId: req.user })
      .populate('challengeId');

    // 4. For each user-challenge, calculate unread chat messages
    const withUnreadCounts = await Promise.all(
      freshList.map(async (uc) => {
        const lastRead = uc.lastReadAt || new Date(0);
        let unreadCount = 0;
        if (uc.challengeId) {
          unreadCount = await ChatMessage.countDocuments({
            roomId: uc.challengeId._id,
            timestamp: { $gt: lastRead }
          });
        }
        return {
          ...uc.toObject(),
          progress: mapToObj(uc.progress),
          unreadCount,
        };
      })
    );

    res.json(withUnreadCounts);

  } catch (err) {
    console.error('[user-challenges]', err);
    res.status(500).json({ message: 'Server error' });
  }
});



router.patch('/:id/mark-read', verifyToken, async (req, res) => {
  try {
    const uc = await UserChallenge.findById(req.params.id);
    if (!uc) return res.status(404).json({ message: 'UserChallenge not found' });
    if (uc.userId.toString() !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });

    uc.lastReadAt = new Date();
    await uc.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ───────── PATCH /:id/progress ────────────────────────────── */
 router.patch('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { taskKey, completed } = req.body;
    const isBool = typeof completed === 'boolean';
    const isNum  = typeof completed === 'number' && completed >= 0;
    if (typeof taskKey !== 'string' || (!isBool && !isNum))
      return res.status(400).json({ message: 'Invalid taskKey / completed' });

    // Populate challengeId for date calculations
    const uc = await UserChallenge.findById(req.params.id).populate('challengeId');
    if (!uc) return res.status(404).json({ message: 'Not found' });
    if (uc.userId.toString() !== req.user)
      return res.status(403).json({ message: 'Unauthorized' });

    uc.progress.set(taskKey, completed);
    uc.markModified('progress');

    // --- Streak & lastDoneDate bookkeeping (only for today) ---
    const today      = new Date();
    today.setHours(0,0,0,0);

    // Get the date for the day being updated
    const dayIndex   = parseInt(taskKey.replace('day', ''), 10) - 1;
    const challengeStart = new Date(uc.challengeId.startDate);
    challengeStart.setHours(0,0,0,0);
    const dayDate    = new Date(challengeStart.getTime() + dayIndex * 86400000);
    dayDate.setHours(0,0,0,0);

    const yesterday  = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const markingToday   = (
      dayDate.getTime() === today.getTime() &&
      (
        (isBool && completed === true) ||
        (isNum && completed > 0)
      )
    );
    const unmarkingToday = (
      isBool &&
      dayDate.getTime() === today.getTime() &&
      completed === false &&
      sameDay(uc.lastDoneDate, today)
    );

    if (markingToday) {
      uc.currentStreak = sameDay(uc.lastDoneDate, yesterday)
        ? uc.currentStreak + 1
        : 1;
      uc.longestStreak = Math.max(uc.longestStreak, uc.currentStreak);
      uc.lastDoneDate  = today;
    } else if (unmarkingToday) {
      uc.currentStreak = Math.max(uc.currentStreak - 1, 0);
      uc.lastDoneDate  = null;
    }
    // No streak changes for marking/unmarking PAST or FUTURE days

    await uc.save();

    res.json({
      message:       'Progress updated',
      currentStreak: uc.currentStreak,
      longestStreak: uc.longestStreak,
      progress:      mapToObj(uc.progress),
    });
  } catch (err) {
    console.error('[user-challenges PATCH /progress]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


/* ───────── GET /:id ───────────────────────────────────────── */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const uc = await UserChallenge.findById(req.params.id).populate('challengeId');
    if (!uc)                         return res.status(404).json({ message: 'Not found' });
    if (uc.userId.toString() !== req.user)
      return res.status(403).json({ message: 'Unauthorized' });

    res.json({ ...uc.toObject(), progress: mapToObj(uc.progress) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


/* ───────── PATCH /:id/status ─────────────────────────────── */
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const { status, perfectStreak = false } = req.body;
  if (!['active', 'completed', 'abandoned'].includes(status))
    return res.status(400).json({ message: 'Invalid status' });

  try {
    const uc = await UserChallenge
      .findById(req.params.id)
      .populate('challengeId');

    if (!uc) return res.status(404).json({ message: 'Not found' });
    if (uc.userId.toString() !== req.user)
      return res.status(403).json({ message: 'Unauthorized' });

    uc.status = status;
    await uc.save();

    // --- ADD THIS: Notification on quit ---
    if (status === 'abandoned') {
      await createNotification(
        uc.userId,
        `You quit the challenge: "${uc.challengeId.title}".`,
        `/challenges/${uc.challengeId._id}`,
        'quit',
        uc.challengeId._id
      );
    }

    if (status === 'completed') {
      await grantCompletionReward(uc.userId, uc.challengeId, perfectStreak);
    }

    res.json({ ...uc.toObject(), progress: mapToObj(uc.progress) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


/* ───────── GET /by-challenge/:challengeId ────────────────── */
router.get('/by-challenge/:challengeId', authMiddleware, async (req, res) => {
  try {
    const uc = await UserChallenge.findOne({
      challengeId: req.params.challengeId,
      userId:      req.user,
    }).populate('challengeId');

    if (!uc) return res.status(404).json({ message: 'Not found' });
    res.json({ ...uc.toObject(), progress: mapToObj(uc.progress) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
