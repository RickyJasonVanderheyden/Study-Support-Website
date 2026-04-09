const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const PeerSession = require('../../models/PeerSession');
const SessionBooking = require('../../models/SessionBooking');
const SessionRating = require('../../models/SessionRating');

const toCardPayload = (session, bookingCount, ratingSummary) => ({
  ...session.toObject(),
  bookingCount,
  averageRating: Number((ratingSummary.averageRating || 0).toFixed(2)),
  ratingCount: ratingSummary.ratingCount || 0,
});

router.get('/', async (req, res) => {
  try {
    const { moduleCode, status, q } = req.query;
    const filters = {};

    if (moduleCode) filters.moduleCode = String(moduleCode).toUpperCase();
    if (status) filters.status = status;
    if (q) {
      filters.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { hostName: { $regex: q, $options: 'i' } },
        { moduleName: { $regex: q, $options: 'i' } },
      ];
    }

    const sessions = await PeerSession.find(filters).sort({ dateTime: 1, createdAt: -1 });
    const sessionIds = sessions.map((item) => item._id);

    const [bookingAggregation, ratingAggregation] = await Promise.all([
      SessionBooking.aggregate([
        { $match: { sessionId: { $in: sessionIds }, status: 'joined' } },
        { $group: { _id: '$sessionId', bookingCount: { $sum: 1 } } },
      ]),
      SessionRating.aggregate([
        { $match: { sessionId: { $in: sessionIds } } },
        {
          $group: {
            _id: '$sessionId',
            ratingCount: { $sum: 1 },
            averageRating: { $avg: '$rating' },
          },
        },
      ]),
    ]);

    const bookingMap = new Map(bookingAggregation.map((row) => [String(row._id), row.bookingCount]));
    const ratingMap = new Map(ratingAggregation.map((row) => [String(row._id), row]));

    const payload = sessions.map((session) =>
      toCardPayload(
        session,
        bookingMap.get(String(session._id)) || 0,
        ratingMap.get(String(session._id)) || {}
      )
    );

    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const session = await PeerSession.findById(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const [bookings, ratings] = await Promise.all([
      SessionBooking.find({ sessionId: id, status: 'joined' }).sort({ createdAt: -1 }),
      SessionRating.find({ sessionId: id }).sort({ createdAt: -1 }),
    ]);

    const total = ratings.length;
    const average = total ? ratings.reduce((sum, item) => sum + item.rating, 0) / total : 0;

    res.json({
      ...session.toObject(),
      bookingCount: bookings.length,
      bookings,
      ratings,
      averageRating: Number(average.toFixed(2)),
      ratingCount: total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session', details: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payload = {
      ...req.body,
      moduleCode: String(req.body.moduleCode || '').toUpperCase(),
      hostEmail: String(req.body.hostEmail || '').toLowerCase(),
    };

    const session = await PeerSession.create(payload);
    res.status(201).json(session);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create session', details: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const payload = { ...req.body };
    if (payload.moduleCode) payload.moduleCode = String(payload.moduleCode).toUpperCase();
    if (payload.hostEmail) payload.hostEmail = String(payload.hostEmail).toLowerCase();

    const updated = await PeerSession.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update session', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const deleted = await PeerSession.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await Promise.all([
      SessionBooking.deleteMany({ sessionId: id }),
      SessionRating.deleteMany({ sessionId: id }),
    ]);

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session', details: error.message });
  }
});

module.exports = router;
