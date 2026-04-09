const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SessionRating = require('../../models/SessionRating');
const SessionBooking = require('../../models/SessionBooking');
const PeerSession = require('../../models/PeerSession');

router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const ratings = await SessionRating.find({ sessionId }).sort({ createdAt: -1 });
    const ratingCount = ratings.length;
    const averageRating = ratingCount
      ? Number((ratings.reduce((sum, item) => sum + item.rating, 0) / ratingCount).toFixed(2))
      : 0;

    res.json({ ratings, ratingCount, averageRating });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ratings', details: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { sessionId, studentName, studentEmail, rating, comment } = req.body;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const session = await PeerSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const normalizedEmail = String(studentEmail || '').toLowerCase();
    const joined = await SessionBooking.exists({
      sessionId,
      studentEmail: normalizedEmail,
      status: 'joined',
    });

    if (!joined) {
      return res.status(403).json({ error: 'You must join the session before rating' });
    }

    const created = await SessionRating.create({
      sessionId,
      studentName,
      studentEmail: normalizedEmail,
      rating,
      comment,
    });

    res.status(201).json(created);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Student already rated this session' });
    }
    res.status(400).json({ error: 'Failed to submit rating', details: error.message });
  }
});

module.exports = router;
