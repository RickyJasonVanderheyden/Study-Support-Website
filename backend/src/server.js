import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { subjectCategories, getSubjectBySlug } from './data/subjectQuestions.js'
import { connectToDatabase, isDatabaseConnected } from './config/database.js'
import QuizAttempt from './models/QuizAttempt.js'

dotenv.config()

const app = express()
const DEFAULT_PORT = Number(process.env.PORT) || 5000
const FRONTEND_URL = process.env.FRONTEND_URL

app.use(
  cors({
    origin: FRONTEND_URL || true,
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'lmsdb-backend',
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
  })
})

app.get('/api/subjects', (_req, res) => {
  const subjects = subjectCategories.map(({ slug, name, description, questions }) => ({
    slug,
    name,
    description,
    totalQuestions: questions.length,
  }))

  res.json(subjects)
})

app.get('/api/quizzes', async (_req, res) => {
  try {
    const quizzes = await QuizAttempt.db
      .collection('quizzes')
      .find(
        {},
        {
          projection: {
            title: 1,
            subject: 1,
            totalQuestions: 1,
            difficulty: 1,
            timeLimit: 1,
          },
        },
      )
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .toArray()

    return res.json(quizzes)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch quizzes' })
  }
})

app.get('/api/peer-sessions', async (req, res) => {
  try {
    const { userId } = req.query
    const query = {}

    if (userId) {
      query.$or = [{ user: String(userId) }, { user: null }]
    }

    const peerSessions = await QuizAttempt.db
      .collection('peersessions')
      .find(query, {
        projection: {
          title: 1,
          moduleCode: 1,
          moduleName: 1,
          description: 1,
          hostName: 1,
          hostEmail: 1,
          meetingLink: 1,
          materialsLink: 1,
          dateTime: 1,
          durationMinutes: 1,
          maxParticipants: 1,
          status: 1,
          user: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      })
      .sort({ dateTime: -1, createdAt: -1, _id: -1 })
      .limit(100)
      .toArray()

    return res.json(peerSessions)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch peer sessions' })
  }
})

app.get('/api/subjects/:slug/questions', (req, res) => {
  const { slug } = req.params
  const subject = getSubjectBySlug(slug)

  if (!subject) {
    return res.status(404).json({ message: 'Subject not found' })
  }

  const questions = subject.questions.map(({ question, options }, index) => ({
    id: index + 1,
    question,
    options,
  }))

  return res.json({
    slug: subject.slug,
    name: subject.name,
    description: subject.description,
    totalQuestions: subject.questions.length,
    questions,
  })
})

app.post('/api/subjects/:slug/submit', async (req, res) => {
  const { slug } = req.params
  const subject = getSubjectBySlug(slug)

  if (!subject) {
    return res.status(404).json({ message: 'Subject not found' })
  }

  const { answers, userId = null, timeTaken = 0 } = req.body

  if (!Array.isArray(answers)) {
    return res.status(400).json({ message: 'Invalid payload. "answers" must be an array.' })
  }

  const details = subject.questions.map((item, index) => {
    const selectedAnswer = Number.isInteger(answers[index]) ? answers[index] : null
    const isCorrect = selectedAnswer === item.correctAnswer

    return {
      questionNumber: index + 1,
      selectedAnswer,
      correctAnswer: item.correctAnswer,
      isCorrect,
    }
  })

  const score = details.reduce((total, current) => (current.isCorrect ? total + 1 : total), 0)

  const percentage = Math.round((score / subject.questions.length) * 100)
  const completedAt = new Date()

  try {
    await QuizAttempt.create({
      user: userId,
      subjectSlug: subject.slug,
      subjectName: subject.name,
      answers: details.map((item) => item.selectedAnswer),
      score,
      total: subject.questions.length,
      totalQuestions: subject.questions.length,
      percentage,
      submittedAt: completedAt,
      completedAt,
      status: 'completed',
      timeTaken: Number.isFinite(Number(timeTaken)) ? Number(timeTaken) : 0,
    })
  } catch (error) {
    console.error('Failed to save quiz attempt:', error.message)
  }

  return res.json({
    subject: subject.name,
    score,
    total: subject.questions.length,
    percentage,
    details,
  })
})

app.get('/api/attempts', async (req, res) => {
  try {
    const { subjectSlug, userId } = req.query
    const query = {}

    if (subjectSlug) {
      query.subjectSlug = String(subjectSlug)
    }

    if (userId) {
      query.$or = [{ user: String(userId) }, { user: null }]
    }

    const attempts = await QuizAttempt.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quiz',
          foreignField: '_id',
          as: 'quizDoc',
        },
      },
      {
        $unwind: {
          path: '$quizDoc',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          quizTitle: '$quizDoc.title',
          quizSubject: '$quizDoc.subject',
          quizTotalQuestions: '$quizDoc.totalQuestions',
        },
      },
      { $sort: { completedAt: -1, submittedAt: -1, _id: -1 } },
      { $limit: 50 },
      {
        $project: {
          quizDoc: 0,
        },
      },
    ])

    return res.json(attempts)
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch attempts' })
  }
})

async function startServer() {
  try {
    await connectToDatabase()

    const startListening = (port) => {
      const server = app.listen(port, () => {
        console.log(`LMS backend running on http://localhost:${port}`)
      })

      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          const nextPort = Number(port) + 1
          console.warn(`Port ${port} is already in use. Retrying on ${nextPort}...`)
          startListening(nextPort)
          return
        }

        console.error('Server startup failed:', error.message)
        process.exit(1)
      })
    }

    startListening(DEFAULT_PORT)
  } catch (error) {
    console.error('Server startup failed:', error.message)
    process.exit(1)
  }
}

startServer()
