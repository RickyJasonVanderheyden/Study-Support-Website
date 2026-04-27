const express = require('express');
const authMiddleware = require('../../middleware/authMiddleware');
const Student = require('../../models/Student');
const QuizAttempt = require('../../models/QuizAttempt');
const StudyActivity = require('../../models/StudyActivity');
const PeerSession = require('../../models/PeerSession');
const { subjectCategories, getSubjectBySlug } = require('../../data/subjectCategories');

const router = express.Router();

function computeGroupLabel(user) {
  if (!user) return 'N/A';
  if (!user.mainGroup && !user.subGroup) return 'N/A';
  return `MG${String(user.mainGroup || 0).padStart(2, '0')} - SG${user.subGroup || 0}`;
}

async function getOrCreateStudent(user) {
  const fallbackRegNo = user.registrationNumber || `STU-${String(user._id).slice(-6).toUpperCase()}`;
  let student = await Student.findOne({
    $or: [{ userId: user._id }, { registrationNumber: fallbackRegNo }],
  });

  if (!student) {
    student = await Student.create({
      userId: user._id,
      name: user.name || 'Student',
      registrationNumber: fallbackRegNo,
      group: computeGroupLabel(user),
      attendance: 0,
    });
    return student;
  }

  // Keep basic student profile synced with auth user profile.
  student.name = user.name || student.name;
  student.registrationNumber = fallbackRegNo;
  student.group = computeGroupLabel(user);
  await student.save();
  return student;
}

function toAttemptDto(attempt) {
  const total = Number(attempt.totalQuestions || attempt.total || 10);
  const score = Number(attempt.score || 0);
  const percentage = Number.isFinite(Number(attempt.percentage))
    ? Number(attempt.percentage)
    : total > 0
      ? Math.round((score / total) * 100)
      : 0;

  return {
    id: attempt._id,
    subjectCategory: attempt.subjectCategory || attempt.subjectSlug || 'general',
    subjectName: attempt.subjectName || 'General Subject',
    score,
    totalQuestions: total,
    percentage,
    completedAt: attempt.completedAt || attempt.createdAt,
    status: attempt.status || 'completed',
  };
}

function calculateStreakFromDates(dates) {
  if (!dates.length) return 0;
  const uniqueDays = [...new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)))].sort((a, b) =>
    b.localeCompare(a)
  );
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDays.length; i += 1) {
    const expected = new Date(cursor);
    expected.setDate(cursor.getDate() - i);
    const expectedIso = expected.toISOString().slice(0, 10);
    if (uniqueDays[i] === expectedIso) streak += 1;
    else break;
  }

  return streak;
}

router.use(authMiddleware);

router.get('/student/current', async (req, res) => {
  try {
    const student = await getOrCreateStudent(req.user);
    return res.json({
      id: student._id,
      name: student.name,
      registrationNumber: student.registrationNumber,
      group: student.group,
      attendance: student.attendance,
      createdAt: student.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load current student' });
  }
});

router.get('/subjects', async (_req, res) => {
  const subjects = subjectCategories.map(({ slug, name, description, questions }) => ({
    slug,
    name,
    description,
    totalQuestions: questions.length,
  }));
  return res.json(subjects);
});

router.get('/quiz/:category', async (req, res) => {
  const subject = getSubjectBySlug(req.params.category);
  if (!subject) {
    return res.status(404).json({ error: 'Subject category not found' });
  }

  return res.json({
    slug: subject.slug,
    name: subject.name,
    description: subject.description,
    questions: subject.questions.map((q, index) => ({
      id: index + 1,
      question: q.question,
      options: q.options,
    })),
  });
});

router.post('/quiz/:category/submit', async (req, res) => {
  try {
    const subject = getSubjectBySlug(req.params.category);
    if (!subject) {
      return res.status(404).json({ error: 'Subject category not found' });
    }

    const { answers } = req.body;
    const timeTakenSeconds = Number(req.body.timeTaken || 0);

    if (!Array.isArray(answers) || answers.length !== subject.questions.length) {
      return res.status(400).json({ error: `Answers must contain ${subject.questions.length} entries` });
    }

    const student = await getOrCreateStudent(req.user);

    const gradedAnswers = subject.questions.map((question, index) => {
      const selectedAnswer = Number.isInteger(answers[index]) ? answers[index] : null;
      const isCorrect = selectedAnswer === question.correctAnswer;
      return {
        questionIndex: index,
        selectedAnswer,
        isCorrect,
      };
    });

    const score = gradedAnswers.reduce((sum, answer) => (answer.isCorrect ? sum + 1 : sum), 0);
    const totalQuestions = subject.questions.length;
    const percentage = Math.round((score / totalQuestions) * 100);

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      studentId: student._id,
      subjectCategory: subject.slug,
      subjectSlug: subject.slug,
      subjectName: subject.name,
      quiz: null,
      answers: gradedAnswers,
      score,
      total: totalQuestions,
      totalQuestions,
      percentage,
      timeTaken: Number.isFinite(timeTakenSeconds) ? Math.max(0, timeTakenSeconds) : 0,
      completedAt: new Date(),
      status: 'completed',
    });

    await StudyActivity.create({
      studentId: student._id,
      type: 'subject_quiz',
      subjectCategory: subject.slug,
      minutes: Math.max(1, Math.round((Number(attempt.timeTaken) || 0) / 60)),
    });

    return res.json({
      message: 'Quiz submitted successfully',
      score,
      totalQuestions,
      percentage,
      attemptId: attempt._id,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

router.get('/dashboard/summary', async (req, res) => {
  try {
    const student = await getOrCreateStudent(req.user);
    const attempts = await QuizAttempt.find({ studentId: student._id, subjectCategory: { $ne: '' } })
      .sort({ completedAt: -1 })
      .limit(100);

    const mapped = attempts.map(toAttemptDto);
    const mcqMarks =
      mapped.length > 0
        ? Math.round(mapped.reduce((sum, attempt) => sum + attempt.percentage, 0) / mapped.length)
        : 0;

    const bySubject = new Map();
    mapped.forEach((attempt) => {
      if (!bySubject.has(attempt.subjectCategory)) bySubject.set(attempt.subjectCategory, []);
      bySubject.get(attempt.subjectCategory).push(attempt);
    });

    const myCourses = [...bySubject.entries()].map(([subjectCategory, rows]) => {
      const latest = rows[0];
      return {
        subjectCategory,
        subjectName: latest.subjectName,
        marks: `${latest.score}/${latest.totalQuestions}`,
        percentage: latest.percentage,
        badge: 'Subject Quiz',
      };
    });

    const currentTermPercentage =
      mapped.length > 0
        ? Math.round(mapped.reduce((sum, item) => sum + item.percentage, 0) / mapped.length)
        : 0;

    return res.json({
      student: {
        id: student._id,
        name: student.name,
        registrationNumber: student.registrationNumber,
        group: student.group,
        attendance: student.attendance,
      },
      stats: {
        mcqMarks,
        attendance: student.attendance,
        quizAttempts: mapped.length,
      },
      activity: mapped.slice(0, 7).reverse().map((item) => ({
        day: new Date(item.completedAt).toLocaleDateString('en-US', { weekday: 'short' }),
        percentage: item.percentage,
      })),
      myCourses: myCourses.slice(0, 6),
      subjectMarks: {
        currentTermPercentage,
        history: mapped.slice(0, 8),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
});

router.get('/portfolio', async (req, res) => {
  try {
    const student = await getOrCreateStudent(req.user);
    const attempts = await QuizAttempt.find({ studentId: student._id, subjectCategory: { $ne: '' } })
      .sort({ completedAt: -1 })
      .limit(100);
    const mapped = attempts.map(toAttemptDto);

    const overallMarks =
      mapped.length > 0 ? Math.round(mapped.reduce((sum, row) => sum + row.percentage, 0) / mapped.length) : 0;
    const quizAverage = overallMarks;
    const completion = mapped.length > 0 ? 100 : 0;
    const reachouts = 0;

    const bestScore = mapped.length > 0 ? Math.max(...mapped.map((a) => a.percentage)) : 0;
    const latestAttempts = mapped.slice(0, 3);
    const latest = latestAttempts[0] || null;

    const studyActivities = await StudyActivity.find({ studentId: student._id })
      .sort({ createdAt: -1 })
      .limit(100);
    const totalStudyMinutes = studyActivities.reduce((sum, item) => sum + Number(item.minutes || 0), 0);

    const peerSessions = await PeerSession.find({
      $or: [{ studentId: student._id }, { hostEmail: req.user.email }],
    }).sort({ createdAt: -1 });
    const averagePeerSessionRating =
      peerSessions.length > 0
        ? Number(
            (peerSessions.reduce((sum, session) => sum + Number(session.rating || 0), 0) / peerSessions.length).toFixed(1)
          )
        : 0;

    return res.json({
      student: {
        id: student._id,
        name: student.name,
        registrationNumber: student.registrationNumber,
        group: student.group,
        attendance: student.attendance,
        lastActivity: latest?.completedAt || null,
      },
      stats: {
        overallMarks,
        quizAverage,
        reachouts,
        completion,
      },
      quizMarks: {
        averageScore: overallMarks,
        bestScore,
        latestAttempts,
      },
      subjectQuizMarks: mapped.slice(0, 10),
      latestSubmissionSummary: latest
        ? `${latest.subjectName} with ${latest.score}/${latest.totalQuestions}`
        : 'No submissions yet',
      studyTracker: {
        interactiveQuizzes: { total: mapped.length },
        mindMaps: { total: 0 },
        totalStudyMinutes,
      },
      peerSessionsProgress: {
        total: peerSessions.length,
        averagePeerSessionRating,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load portfolio data' });
  }
});

router.get('/performance-analytics', async (req, res) => {
  try {
    const student = await getOrCreateStudent(req.user);
    const attempts = await QuizAttempt.find({ studentId: student._id, subjectCategory: { $ne: '' } })
      .sort({ completedAt: -1 })
      .limit(200);
    const mapped = attempts.map(toAttemptDto);

    const averageScore =
      mapped.length > 0 ? Math.round(mapped.reduce((sum, item) => sum + item.percentage, 0) / mapped.length) : 0;
    const bestScore = mapped.length > 0 ? Math.max(...mapped.map((item) => item.percentage)) : 0;
    const streak = calculateStreakFromDates(mapped.map((item) => item.completedAt));

    return res.json({
      stats: {
        averageScore,
        bestScore,
        attempts: mapped.length,
        streak,
      },
      overview: [
        'This page summarizes quiz performance and learning momentum.',
        'All of these pages use the same clean student dashboard language.',
        'Use the section links to move quickly between student views.',
      ],
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load performance analytics' });
  }
});

router.get('/study-time', async (req, res) => {
  try {
    const student = await getOrCreateStudent(req.user);
    const studyActivities = await StudyActivity.find({ studentId: student._id }).sort({ createdAt: -1 }).limit(300);
    const attempts = await QuizAttempt.find({ studentId: student._id, subjectCategory: { $ne: '' } })
      .sort({ completedAt: -1 })
      .limit(200);

    const totalMinutes = studyActivities.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
    const averageAttemptMinutes =
      attempts.length > 0
        ? Math.round(attempts.reduce((sum, item) => sum + Number(item.timeTaken || 0), 0) / attempts.length / 60)
        : 0;
    const streak = calculateStreakFromDates(studyActivities.map((item) => item.createdAt));

    return res.json({
      stats: {
        studyMinutes: totalMinutes,
        averageAttemptTime: averageAttemptMinutes,
        attempts: attempts.length,
        streak,
      },
      overview: [
        'Use this page to understand where your study time is going.',
        'Time trends are calculated from quiz activity and tracked minutes.',
        'Consistent daily review improves retention and score confidence.',
      ],
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load study time data' });
  }
});

router.get('/peer-sessions', async (req, res) => {
  try {
    const student = await getOrCreateStudent(req.user);
    const peerSessions = await PeerSession.find({
      $or: [{ studentId: student._id }, { hostEmail: req.user.email }],
    })
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json(
      peerSessions.map((session) => ({
        id: session._id,
        title: session.title,
        rating: Number(session.rating || 0),
        status: session.status || 'upcoming',
        createdAt: session.createdAt,
      }))
    );
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load peer sessions' });
  }
});

module.exports = router;

