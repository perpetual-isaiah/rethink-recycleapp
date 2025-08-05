const express = require('express');
const router = express.Router();
const Challenge      = require('../models/Challenge');
const User           = require('../models/User');
const UserChallenge  = require('../models/UserChallenge');
const Reward         = require('../models/Reward'); // was commented out
const verifyToken    = require('../middleware/verifyToken');
const { grantWelcomeReward } = require('../lib/rewardHelpers');
const { createNotification } = require('../services/notifications');
console.log('createNotification function:', createNotification); // sanity check

const { 
  sendChallengeCreatedNotification, 
  sendChallengeJoinedNotification,
  sendChallengeApprovedNotification 
} = require('../services/pushNotifications');


// Helper to centralize 500 errors
const respond500 = (res, msg, err) => {
  console.error(err);
  return res.status(500).json({ message: msg, error: err.message });
};


/*  POST   /api/challenges        → create challenge                      */
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, startDate, endDate, whyParticipate } = req.body;
    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ message: 'Invalid start/end date' });
    }

    const user    = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const isAdmin = user.role === 'admin';

    const challenge = await Challenge.create({
      title,
      description,
      startDate: start,
      endDate:   end,
      createdBy: req.user.id,
      whyParticipate,
      approved:  isAdmin,
    });

    // Send in-app notification
    await createNotification(
      req.user.id,
      `Your challenge "${challenge.title}" has been created${isAdmin ? ' and approved.' : ' and is pending approval.'}`,
      `/challenges/${challenge._id}`,
      'generic',
      challenge._id
    );

    // Send push notification
    await sendChallengeCreatedNotification(
      req.user.id,
      challenge.title,
      challenge._id.toString(),
      isAdmin
    );

    return res.status(201).json({
      message: `Challenge created.${isAdmin ? ' Approved.' : ' Pending approval.'}`,
      challenge
    });

  } catch (err) {
    return respond500(res, 'Error creating challenge', err);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  GET    /api/challenges        → list challenges                       */
/* ──────────────────────────────────────────────────────────────────────── */
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const filter = user.role === 'admin' ? {} : { approved: true };
    const list = await Challenge.find(filter)
      .populate('createdBy', 'name email')
      .populate('participants', 'name email');

    return res.json(list);

  } catch (err) {
    return respond500(res, 'Error fetching challenges', err);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  GET    /api/challenges/:id    → single challenge                      */
/* ──────────────────────────────────────────────────────────────────────── */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('participants', 'name email');
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!challenge.approved && user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to view this challenge' });
    }

    return res.json(challenge);

  } catch (err) {
    return respond500(res, 'Error fetching challenge details', err);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  POST   /api/challenges/:id/join                                      */
/* ──────────────────────────────────────────────────────────────────────── */
router.post('/:id/join', verifyToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (new Date() > challenge.endDate)
      return res.status(400).json({ message: 'Challenge has already ended' });
    if (!challenge.approved)
      return res.status(403).json({ message: 'Challenge is not approved yet' });

    const userId = req.user.id;

    // Idempotent join
    let userChallenge = await UserChallenge.findOne({ userId, challengeId: challenge._id });
    if (userChallenge) {
      return res.status(200).json({
        message: 'Already joined',
        userChallenge,
      });
    }

    if (challenge.createdBy.toString() !== userId) {
      await sendChallengeJoinedNotification(
        challenge.createdBy,
        req.user.name,
        challenge.title,
        challenge._id.toString()
      );
    }

    // Create participation record
    userChallenge = await UserChallenge.create({
      userId,
      challengeId: challenge._id,
      status: 'active',
      progress: new Map(),
      joinDate: new Date(),
    });

    // Add to participants array
    if (!challenge.participants.includes(userId)) {
      challenge.participants.push(userId);
      await challenge.save();
    }

    // Grant welcome reward
    const reward = await grantWelcomeReward(userId, challenge._id);

    // ① Notify the **joiner**
    await createNotification(
      userId,
      `You joined the challenge: "${challenge.title}"`,
      `/challenges/${challenge._id}`,
      'join',
      challenge._id
    );

    // ② Notify the **creator**
    if (challenge.createdBy.toString() !== userId) {
      await createNotification(
        challenge.createdBy,
        `${req.user.name} joined your challenge "${challenge.title}"`,
        `/challenges/${challenge._id}`,
        'join',
        challenge._id
      );
    }

    // ③ Notify about **reward**, if any
    if (reward) {
      await createNotification(
        userId,
        `🎉 You earned a reward: ${reward.label} (${reward.stars}⭐)`,
        `/rewards/${reward._id}`,
        'reward',
        reward._id
      );
    }

    return res.status(201).json({
      message: 'Successfully joined challenge',
      reward,
      userChallenge,
    });

  } catch (err) {
    // Duplicate key fallback
    if (err.code === 11000) {
      const uc = await UserChallenge.findOne({ userId: req.user.id, challengeId: req.params.id });
      return res.status(200).json({
        message: 'Already joined',
        userChallenge: uc,
      });
    }
    console.error(err);
    return res.status(500).json({ message: 'Error joining challenge', error: err.message });
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  GET    /api/challenges/joined → list user’s joined challenges         */
/* ──────────────────────────────────────────────────────────────────────── */
router.get('/joined', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'challengesJoined',
      select: 'title description startDate endDate approved',
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ challenges: user.challengesJoined });
  } catch (error) {
    return respond500(res, 'Error fetching joined challenges', error);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  PATCH  /api/challenges/:id/approve → admin approves a challenge       */
/* ──────────────────────────────────────────────────────────────────────── */
router.patch('/:id/approve', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can approve challenges' });
    }

    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    await createNotification(
      challenge.createdBy,
      `Your challenge "${challenge.title}" has been approved!`,
      `/challenges/${challenge._id}`,
      'approved',
      challenge._id
    );

     // Send push notification
    await sendChallengeApprovedNotification(
      challenge.createdBy,
      challenge.title,
      challenge._id.toString()
    );

    return res.json({ message: 'Challenge approved', challenge });
  } catch (error) {
    return respond500(res, 'Error approving challenge', error);
  }
});

// PATCH /api/challenges/:id/decline
// PATCH /api/challenges/:id/decline → admin declines a challenge
router.patch('/:id/decline', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can decline challenges' });
    }

    // 1. Update the challenge status
    const challenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      { approved: false, declined: true },
      { new: true }
    );
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    // 2. Try to send notifications, but don't let errors break the API
    try {
      await createNotification(
        challenge.createdBy,
        `Your challenge "${challenge.title}" was declined by admin.`,
        `/challenges/${challenge._id}`,
        'declined',
        challenge._id
      );
      const { sendPushNotification } = require('../services/pushNotifications');
      await sendPushNotification(
        challenge.createdBy,
        'Challenge Declined',
        `Your challenge "${challenge.title}" was declined by the admin.`,
        { type: 'challenge_declined', challengeId: challenge._id, challengeTitle: challenge.title }
      );
    } catch (notifErr) {
      // Log but DON'T return error!
      console.error('[Decline Notification Error]', notifErr);
    }

    // 3. Always return success if DB updated
    return res.json({ message: 'Challenge declined', challenge });
  } catch (error) {
    return respond500(res, 'Error declining challenge', error);
  }
});


// GET /api/challenges/declined
router.get('/declined', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view declined challenges' });
    }
    const declinedChallenges = await Challenge.find({ declined: true }).sort({ createdAt: -1 });
    res.json(declinedChallenges);
  } catch (error) {
    return respond500(res, 'Error fetching declined challenges', error);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  POST   /api/challenges/:id/like → toggle like & notify creator       */
/* ──────────────────────────────────────────────────────────────────────── */
router.post('/:id/like', verifyToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const userId = req.user.id;
    const liked  = challenge.likes.some(id => id.equals(userId));

    if (liked) {
      challenge.likes.pull(userId);
    } else {
      challenge.likes.push(userId);
      if (challenge.createdBy.toString() !== userId) {
        await createNotification(
          challenge.createdBy,
          `${req.user.name} liked your challenge "${challenge.title}".`,
          `/challenges/${challenge._id}`,
          'generic',
          challenge._id
        );
      }
    }

    await challenge.save();
    return res.json({
      message: liked ? 'Like removed' : 'Challenge liked',
      likeCount: challenge.likes.length
    });
  } catch (error) {
    return respond500(res, 'Error toggling like', error);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  POST   /api/challenges/:id/comment → add comment & notify creator     */
/* ──────────────────────────────────────────────────────────────────────── */
router.post('/:id/comment', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Comment text required' });

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    challenge.comments.push({ user: req.user.id, text: text.trim() });
    await challenge.save();

    if (challenge.createdBy.toString() !== req.user.id) {
      await createNotification(
        challenge.createdBy,
        `${req.user.name} commented on your challenge "${challenge.title}".`,
        `/challenges/${challenge._id}`,
        'comment',
        challenge._id
      );
    }

    const populated = await challenge.populate({
      path: 'comments.user', select: 'name avatar'
    });
    return res.status(201).json({ message: 'Comment added', comments: populated.comments });

  } catch (error) {
    return respond500(res, 'Error adding comment', error);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  GET    /api/challenges/:id/comments → list comments & replies         */
/* ──────────────────────────────────────────────────────────────────────── */
router.get('/:id/comments', verifyToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('comments.user', 'name avatar')
      .populate('comments.replies.user', 'name avatar');
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    return res.json(challenge.comments);
  } catch (error) {
    return respond500(res, 'Error fetching comments', error);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  PUT    /api/challenges/:cid/comments/:cmid → edit a comment          */
/* ──────────────────────────────────────────────────────────────────────── */
router.put('/:challengeId/comments/:commentId', verifyToken, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Comment text required' });

  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    const comment = challenge.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    comment.text = text;
    await challenge.save();
    return res.json({ message: 'Comment updated', comment });
  } catch (err) {
    return respond500(res, 'Error updating comment', err);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  DELETE /api/challenges/:cid/comments/:cmid → delete a comment        */
/* ──────────────────────────────────────────────────────────────────────── */
router.delete('/:challengeId/comments/:commentId', verifyToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    const comment = challenge.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    comment.remove();
    await challenge.save();
    return res.json({ message: 'Comment deleted' });
  } catch (err) {
    return respond500(res, 'Error deleting comment', err);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  POST   /api/challenges/:cid/comments/:cmid/replies → add a reply      */
/* ──────────────────────────────────────────────────────────────────────── */
router.post('/:challengeId/comments/:commentId/replies', verifyToken, async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ message: 'Reply text required' });

  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    const comment = challenge.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    comment.replies.push({ user: req.user.id, text: text.trim() });
    await challenge.save();

    // ④ Notify original commenter of the reply
    if (comment.user.toString() !== req.user.id) {
      await createNotification(
        comment.user,
        `${req.user.name} replied to your comment on "${challenge.title}"`,
        `/challenges/${challenge._id}`,
        'reply',
        challenge._id
      );
    }

    return res.status(201).json({ message: 'Reply added', replies: comment.replies });
  } catch (err) {
    return respond500(res, 'Error adding reply', err);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  PUT    /api/challenges/:cid/:cmid/replies/:rid → edit a reply        */
/* ──────────────────────────────────────────────────────────────────────── */
router.put('/:challengeId/comments/:commentId/replies/:replyId', verifyToken, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Reply text required' });

  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    const comment = challenge.comments.id(req.params.commentId);
    const reply   = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });
    if (reply.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    reply.text = text;
    await challenge.save();
    return res.json({ message: 'Reply updated', reply });
  } catch (err) {
    return respond500(res, 'Error updating reply', err);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  DELETE /api/challenges/:cid/:cmid/replies/:rid → delete a reply      */
/* ──────────────────────────────────────────────────────────────────────── */
router.delete('/:challengeId/comments/:commentId/replies/:replyId', verifyToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.challengeId);
    const comment   = challenge.comments.id(req.params.commentId);
    const reply     = comment.replies.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });
    if (reply.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    reply.remove();
    await challenge.save();
    return res.json({ message: 'Reply deleted' });
  } catch (err) {
    return respond500(res, 'Error deleting reply', err);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  POST   /api/challenges/:id/complete → user marks completion         */
/* ──────────────────────────────────────────────────────────────────────── */
router.post('/:id/complete', verifyToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Not found' });

    // your completion logic here (e.g. update UserChallenge) …

    // ⑤ Notify the user they completed
    await createNotification(
      req.user.id,
      `🎉 You completed "${challenge.title}"!`,
      `/challenges/${challenge._id}/summary`,
      'complete',
      challenge._id
    );

    return res.json({ message: 'Completed' });
  } catch (error) {
    return respond500(res, 'Error completing challenge', error);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  PATCH  /api/challenges/:id/quit → user quits challenge              */
/* ──────────────────────────────────────────────────────────────────────── */
router.patch('/:id/quit', verifyToken, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const uc = await UserChallenge.findOne({ userId: req.user.id, challengeId: challenge._id });
    if (!uc) return res.status(400).json({ message: 'You are not participating' });

    uc.status   = 'quit';
    uc.quitDate = new Date();
    await uc.save();

    challenge.participants.pull(req.user.id);
    await challenge.save();

    if (challenge.createdBy.toString() !== req.user.id) {
  await sendPushNotification(
    challenge.createdBy,
    `Participant Left`,
    `${req.user.name} quit your challenge "${challenge.title}".`,
    { type: 'challenge_quit', challengeId: challenge._id }
  );
}


    // ⑥ Notify quitting user
    await createNotification(
      req.user.id,
      `You quit the challenge: "${challenge.title}".`,
      `/challenges/${challenge._id}`,
      'quit',
      challenge._id
    );

    return res.json({ message: 'Challenge Ended', userChallenge: uc });
  } catch (error) {
    return respond500(res, 'Error quitting challenge', error);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  POST   /api/challenges/rewards/:id/claim → user claims a reward     */
/* ──────────────────────────────────────────────────────────────────────── */
router.post('/rewards/:id/claim', verifyToken, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) return res.status(404).json({ message: 'Reward not found' });

    // your reward-claim logic…

    // ⑦ Notify user of claimed reward
    await createNotification(
      req.user.id,
      `🏆 You earned a reward: "${reward.name}"!`,
      `/rewards/${reward._id}`,
      'reward',
      reward._id
    );

    return res.json({ message: 'Reward claimed' });
  } catch (error) {
    return respond500(res, 'Error claiming reward', error);
  }
});


/* ──────────────────────────────────────────────────────────────────────── */
/*  GET    /api/challenges/rewards  → list all rewards                   */
/* ──────────────────────────────────────────────────────────────────────── */
router.get('/rewards', verifyToken, async (req, res) => {
  try {
    const rewards = await Reward.find().sort({ createdAt: -1 });
    return res.json(rewards);
  } catch (error) {
    return respond500(res, 'Error fetching rewards', error);
  }
});


module.exports = router;
