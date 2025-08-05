const Reward     = require('../models/Reward');
const UserReward = require('../models/UserReward');   // ⭐ NEW

/* -------------------------------------------------- *
 * Helper to save both collections in one shot        *
 * -------------------------------------------------- */
async function saveRewardAndLink({ userId, challengeId, label, stars, sticker }) {
  const reward = await Reward.create({ userId, challengeId, label, stars, sticker });
  await UserReward.create({ userId, rewardId: reward._id });   // 👈 link row
  return reward;
}

/* points table from challenge length ---------------- */
exports.calcStars = (days) =>
  days < 15
    ? Math.max(1, Math.floor(days / 2))
    : 8 + Math.floor((days - 15) / 2);               // 8-15

/* 1 ⭐ + random sticker when the user joins ---------- */
exports.grantWelcomeReward = (userId, challengeId) => {
  const stickers = ['🌱', '🌎', '♻️', '🌟'];
  const sticker  = stickers[Math.floor(Math.random() * stickers.length)];

  return saveRewardAndLink({
    userId,
    challengeId,
    label: 'Welcome bonus',
    stars: 1,
    sticker,
  });
};

/* main + bonus spin on completion ------------------- */
exports.grantCompletionReward = async (userId, challenge, perfectStreak = false) => {
  /* star roll */
  const days       = Math.ceil((challenge.endDate - challenge.startDate) / 86400000) + 1;
  const base       = exports.calcStars(days);
  const max        = Math.round(base * 1.5);
  const raw        = base + Math.floor(Math.random() * (max - base + 1));
  const delta      = Math.round(raw * 0.1);
  const completion = raw + (Math.random() < 0.5 ? -delta : delta);

  await saveRewardAndLink({
    userId,
    challengeId: challenge._id,
    label: 'Completion reward',
    stars: completion,
  });

  /* perfect-streak bonus */
  if (perfectStreak) {
    const bonus = 1 + Math.floor(Math.random() * 3);      // +1-3 ⭐
    await saveRewardAndLink({
      userId,
      challengeId: challenge._id,
      label: 'Perfect-streak bonus',
      stars: bonus,
    });
  }
};
