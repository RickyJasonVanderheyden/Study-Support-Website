const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const PeerSession = require('../../models/PeerSession');
const SessionBooking = require('../../models/SessionBooking');
const SessionRating = require('../../models/SessionRating');

const uploadDir = path.join(process.cwd(), 'uploads', 'session-materials');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const base = path
      .basename(file.originalname || 'material', ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 60);
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024, files: 8 },
});

const normalizeTags = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const toStoredFiles = (files = []) =>
  files.map((file) => ({
    originalName: file.originalname || '',
    fileName: file.filename || '',
    filePath: `/uploads/session-materials/${file.filename}`,
    mimeType: file.mimetype || '',
    size: Number(file.size || 0),
    uploadedAt: new Date(),
  }));

const withMaterialUrls = (session, req) => {
  const origin = `${req.protocol}://${req.get('host')}`;
  const value = session && typeof session.toObject === 'function' ? session.toObject() : { ...(session || {}) };
  const files = Array.isArray(value.materialsFiles) ? value.materialsFiles : [];
  value.materialsFiles = files.map((file) => ({
    ...file,
    downloadUrl: file.filePath ? `${origin}${file.filePath}` : '',
  }));
  return value;
};

const deleteStoredFiles = (files = []) => {
  files.forEach((file) => {
    const fileName = file?.fileName || path.basename(file?.filePath || '');
    if (!fileName) return;
    const diskPath = path.join(uploadDir, fileName);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch (_error) {
        // Ignore cleanup failure.
      }
    }
  });
};

const toCardPayload = (session, bookingCount, ratingSummary, recentRatings = [], req) => ({
  ...withMaterialUrls(session, req),
  bookingCount,
  averageRating: Number((ratingSummary.averageRating || 0).toFixed(2)),
  ratingCount: ratingSummary.ratingCount || 0,
  recentRatings,
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

    const [bookingAggregation, ratingAggregation, recentRatingsAgg] = await Promise.all([
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
      sessionIds.length
        ? SessionRating.aggregate([
            { $match: { sessionId: { $in: sessionIds } } },
            { $sort: { createdAt: -1 } },
            {
              $group: {
                _id: '$sessionId',
                items: {
                  $push: {
                    studentName: '$studentName',
                    studentEmail: '$studentEmail',
                    rating: '$rating',
                    createdAt: '$createdAt',
                  },
                },
              },
            },
            { $project: { _id: 1, recentRatings: { $slice: ['$items', 3] } } },
          ])
        : Promise.resolve([]),
    ]);

    const bookingMap = new Map(bookingAggregation.map((row) => [String(row._id), row.bookingCount]));
    const ratingMap = new Map(ratingAggregation.map((row) => [String(row._id), row]));
    const recentMap = new Map(recentRatingsAgg.map((row) => [String(row._id), row.recentRatings || []]));

    const payload = sessions.map((session) =>
      toCardPayload(
        session,
        bookingMap.get(String(session._id)) || 0,
        ratingMap.get(String(session._id)) || {},
        recentMap.get(String(session._id)) || [],
        req
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
      ...withMaterialUrls(session, req),
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

router.post('/', upload.array('materialsFiles', 8), async (req, res) => {
  try {
    const uploadedFiles = toStoredFiles(req.files || []);
    const payload = {
      ...req.body,
      moduleCode: String(req.body.moduleCode || '').toUpperCase(),
      hostEmail: String(req.body.hostEmail || '').toLowerCase(),
      tags: normalizeTags(req.body.tags),
      materialsFiles: uploadedFiles,
    };

    const session = await PeerSession.create(payload);
    res.status(201).json(withMaterialUrls(session, req));
  } catch (error) {
    deleteStoredFiles(toStoredFiles(req.files || []));
    res.status(400).json({ error: 'Failed to create session', details: error.message });
  }
});

router.patch('/:id', upload.array('materialsFiles', 8), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const existing = await PeerSession.findById(id);
    if (!existing) {
      deleteStoredFiles(toStoredFiles(req.files || []));
      return res.status(404).json({ error: 'Session not found' });
    }

    const payload = { ...req.body };
    if (payload.moduleCode) payload.moduleCode = String(payload.moduleCode).toUpperCase();
    if (payload.hostEmail) payload.hostEmail = String(payload.hostEmail).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(payload, 'tags')) {
      payload.tags = normalizeTags(payload.tags);
    }

    const uploadedFiles = toStoredFiles(req.files || []);
    if (uploadedFiles.length > 0) {
      payload.materialsFiles = [...(existing.materialsFiles || []), ...uploadedFiles];
    }

    const updated = await PeerSession.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    res.json(withMaterialUrls(updated, req));
  } catch (error) {
    deleteStoredFiles(toStoredFiles(req.files || []));
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

    deleteStoredFiles(deleted.materialsFiles || []);

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
