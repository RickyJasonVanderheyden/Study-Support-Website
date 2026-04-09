const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SessionBooking = require('../../models/SessionBooking');
const PeerSession = require('../../models/PeerSession');

router.get('/', async (req, res) => {
  try {
    const { sessionId, email } = req.query;
    const filters = {};

    if (sessionId) filters.sessionId = sessionId;
    if (email) filters.studentEmail = String(email).toLowerCase();

    const bookings = await SessionBooking.find(filters).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings', details: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { sessionId, studentName, studentEmail } = req.body;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const session = await PeerSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const joinedCount = await SessionBooking.countDocuments({ sessionId, status: 'joined' });
    if (joinedCount >= session.maxParticipants) {
      return res.status(400).json({ error: 'Session is already full' });
    }

    const booking = await SessionBooking.create({
      sessionId,
      studentName,
      studentEmail: String(studentEmail || '').toLowerCase(),
      status: 'joined',
    });

    res.status(201).json(booking);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Student already joined this session' });
    }
    res.status(400).json({ error: 'Failed to create booking', details: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }

    const deleted = await SessionBooking.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ message: 'Booking removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete booking', details: error.message });
  }
});

module.exports = router;
