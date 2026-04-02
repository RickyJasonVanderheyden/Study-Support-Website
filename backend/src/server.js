import express from 'express'
import cors from 'cors'
import { subjectCategories, getSubjectBySlug } from './data/subjectQuestions.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'lmsdb-backend' })
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

app.post('/api/subjects/:slug/submit', (req, res) => {
  const { slug } = req.params
  const subject = getSubjectBySlug(slug)

  if (!subject) {
    return res.status(404).json({ message: 'Subject not found' })
  }

  const { answers } = req.body

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

  return res.json({
    subject: subject.name,
    score,
    total: subject.questions.length,
    percentage: Math.round((score / subject.questions.length) * 100),
    details,
  })
})

app.listen(PORT, () => {
  console.log(`LMS backend running on http://localhost:${PORT}`)
})
