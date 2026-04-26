const express = require('express');
const mongoose = require('mongoose');
const authMiddleware = require('../../middleware/authMiddleware');
const PeerSession = require('../../models/PeerSession');
const StudyBuddyPrep = require('../../models/StudyBuddyPrep');
const model = require('../../config/gemini');

const router = express.Router();

const ALLOWED_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const normalizeTopics = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
};

const stripCodeFence = (text) =>
  String(text || '')
    .trim()
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim();

const safeJson = (text) => {
  const cleaned = stripCodeFence(text);
  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('AI response was not valid JSON');
  }
};

const normalizePrepPayload = (value) => {
  const prep = value && typeof value === 'object' ? value : {};
  const toArray = (input) => (Array.isArray(input) ? input.filter(Boolean).slice(0, 8) : []);
  const likelyQuestions = Array.isArray(prep.likelyQuestions)
    ? prep.likelyQuestions
        .filter((item) => item && typeof item === 'object')
        .slice(0, 8)
        .map((item) => ({
          question: String(item.question || '').trim(),
          whyItMatters: String(item.whyItMatters || '').trim(),
        }))
    : [];
  const studyPlan = Array.isArray(prep.studyPlan)
    ? prep.studyPlan
        .filter((item) => item && typeof item === 'object')
        .slice(0, 8)
        .map((item) => ({
          step: String(item.step || '').trim(),
          durationMinutes: Number(item.durationMinutes) > 0 ? Number(item.durationMinutes) : 0,
        }))
    : [];

  return {
    title: String(prep.title || '').trim(),
    overview: String(prep.overview || '').trim(),
    revisionGoals: toArray(prep.revisionGoals).map((item) => String(item).trim()),
    likelyQuestions,
    studyPlan,
    quickTips: toArray(prep.quickTips).map((item) => String(item).trim()),
  };
};

const fallbackPrep = ({ session, focusTopics, learningGoal, currentLevel, upcomingExam }) => {
  const baseTopics = focusTopics.length
    ? focusTopics
    : [session.moduleName, session.moduleCode, session.title].filter(Boolean).slice(0, 3);
  const targetGoal = learningGoal || `Understand and practice ${session.title}`;
  const examLine = upcomingExam ? `Keep ${upcomingExam} in mind while revising.` : 'Plan a short self-test after revision.';

  return {
    title: `Study Buddy Prep: ${session.title}`,
    overview: `You are preparing for a ${session.durationMinutes}-minute peer session on ${session.moduleCode}. Focus at ${currentLevel} level and come ready with examples.`,
    revisionGoals: [
      `Summarize the core idea behind ${baseTopics[0] || session.moduleName}.`,
      'Solve at least two practice problems before joining the session.',
      targetGoal,
    ],
    likelyQuestions: baseTopics.map((topic, index) => ({
      question: `What is the key concept in ${topic}, and where do students usually make mistakes?`,
      whyItMatters: index === 0 ? 'This is often tested first in quizzes and viva questions.' : 'This builds confidence for discussion and peer explanation.',
    })),
    studyPlan: [
      { step: 'Warm up with notes and formulas', durationMinutes: 15 },
      { step: 'Practice targeted problems', durationMinutes: 25 },
      { step: 'Prepare one doubt and one explanation to discuss', durationMinutes: 10 },
    ],
    quickTips: [examLine, 'Use active recall: close notes and explain aloud in your own words.', 'Bring one solved and one unsolved problem to the session.'],
  };
};

router.post('/prep', authMiddleware, async (req, res) => {
  try {
    const { sessionId, learningGoal, upcomingExam } = req.body;
    const focusTopics = normalizeTopics(req.body.focusTopics);
    const currentLevel = ALLOWED_LEVELS.includes(req.body.currentLevel) ? req.body.currentLevel : 'Intermediate';

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const session = await PeerSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const fallback = fallbackPrep({ session, focusTopics, learningGoal, currentLevel, upcomingExam });

    if (!model || typeof model.generateContent !== 'function') {
      return res.json({ ...fallback, source: 'fallback' });
    }

    const prompt = `
You are an academic peer-learning assistant.
Create a concise "Study Buddy Prep" JSON for a university peer session.

Session:
- title: ${session.title}
- moduleCode: ${session.moduleCode}
- moduleName: ${session.moduleName}
- description: ${session.description}
- durationMinutes: ${session.durationMinutes}
- difficulty: ${session.difficulty}

Student context:
- level: ${currentLevel}
- focusTopics: ${focusTopics.join(', ') || 'Not specified'}
- learningGoal: ${String(learningGoal || 'Not specified')}
- upcomingExam: ${String(upcomingExam || 'Not specified')}

Return only valid JSON with this schema:
{
  "title": "string",
  "overview": "string",
  "revisionGoals": ["string", "string", "string"],
  "likelyQuestions": [
    { "question": "string", "whyItMatters": "string" },
    { "question": "string", "whyItMatters": "string" },
    { "question": "string", "whyItMatters": "string" }
  ],
  "studyPlan": [
    { "step": "string", "durationMinutes": number },
    { "step": "string", "durationMinutes": number },
    { "step": "string", "durationMinutes": number }
  ],
  "quickTips": ["string", "string", "string"]
}
Keep language practical, no markdown, no extra keys.
`;

    const result = await model.generateContent(prompt);
    const text = result?.response?.text ? result.response.text() : '';
    const parsed = safeJson(text);

    return res.json({
      ...fallback,
      ...parsed,
      source: 'ai',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to generate study prep',
      details: error.message,
    });
  }
});

router.post('/prep/save', authMiddleware, async (req, res) => {
  try {
    const { sessionId, learningGoal, upcomingExam, currentLevel } = req.body;
    const focusTopics = normalizeTopics(req.body.focusTopics);
    const level = ALLOWED_LEVELS.includes(currentLevel) ? currentLevel : 'Intermediate';
    const prep = normalizePrepPayload(req.body.prep);

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const session = await PeerSession.findById(sessionId).select('_id');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!prep.title && !prep.overview && prep.revisionGoals.length === 0) {
      return res.status(400).json({ error: 'Invalid prep payload' });
    }

    const saved = await StudyBuddyPrep.create({
      sessionId,
      studentId: req.user._id,
      studentEmail: req.user.email,
      focusTopics,
      learningGoal: String(learningGoal || '').trim(),
      currentLevel: level,
      upcomingExam: String(upcomingExam || '').trim(),
      prep,
      source: req.body.source === 'ai' ? 'ai' : 'fallback',
    });

    return res.status(201).json({
      message: 'Prep saved successfully',
      item: saved,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to save prep',
      details: error.message,
    });
  }
});

router.get('/prep/history/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const items = await StudyBuddyPrep.find({
      sessionId,
      studentId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('focusTopics learningGoal currentLevel upcomingExam prep source createdAt');

    return res.json(items);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to fetch prep history',
      details: error.message,
    });
  }
});

router.post('/prep/publish', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const prep = normalizePrepPayload(req.body.prep);
    const source = req.body.source === 'ai' ? 'ai' : 'fallback';

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session id' });
    }

    const session = await PeerSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const userEmail = String(req.user?.email || '').toLowerCase();
    const isHost =
      userEmail &&
      String(session.hostEmail || '').toLowerCase() === userEmail &&
      ['session_lead', 'super_admin'].includes(req.user?.role);

    if (!isHost) {
      return res.status(403).json({ error: 'Only the session host can publish shared prep.' });
    }

    if (!prep.title && !prep.overview && prep.revisionGoals.length === 0) {
      return res.status(400).json({ error: 'Generate a prep first before publishing.' });
    }

    session.leadSharedPrep = {
      ...prep,
      source,
      publishedByName: String(req.user?.name || session.hostName || '').trim(),
      publishedByEmail: userEmail,
      publishedAt: new Date(),
    };
    await session.save();

    return res.json({
      message: 'Shared prep published for this session.',
      leadSharedPrep: session.leadSharedPrep,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to publish shared prep',
      details: error.message,
    });
  }
});

module.exports = router;
