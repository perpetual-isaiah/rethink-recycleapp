// routes/rewards.js
const express     = require('express');
const router      = express.Router();
const verifyToken = require('../middleware/verifyToken');
const UserReward  = require('../models/UserReward');  // link table
const Reward      = require('../models/Reward');      // template

/**
 * GET /api/rewards/claimed
 * Returns every reward claimed by the current user.
 * Response: { rewards: [ { _id, label, stars, sticker, challengeId, claimedAt } ] }
 */
router.get('/claimed', verifyToken, async (req, res) => {
  try {
    const claimed = await UserReward.find({ userId: req.user.id })
                                    .sort({ claimedAt: -1 })
                                    .populate('rewardId', 'label stars sticker challengeId');

    const rewards = claimed.map((ur) => ({
      _id:         ur._id,
      label:       ur.rewardId?.label   ?? 'Reward',
      stars:       ur.rewardId?.stars   ?? 0,
      sticker:     ur.rewardId?.sticker ?? null,
      challengeId: ur.rewardId?.challengeId,
      claimedAt:   ur.claimedAt,
    }));

    res.json({ rewards });
  } catch (err) {
    console.error('Error fetching rewards:', err);
    res.status(500).json({ message: 'Error fetching rewards', error: err.message });
  }
});

module.exports = router;
