import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getSubjectBySlug } from '../data/subjectQuestions'
import { submitSubjectQuiz } from '../utils/quizAttemptsApi'

const QUIZ_RESULTS_STORAGE_KEY = 'lms.quizResults'
const ACTIVE_STUDENT_ID = import.meta.env.VITE_STUDENT_ID || null

function saveQuizResult(result) {
  try {
    const raw = localStorage.getItem(QUIZ_RESULTS_STORAGE_KEY)
    const existingResults = raw ? JSON.parse(raw) : []
    const filteredResults = Array.isArray(existingResults)
      ? existingResults.filter((item) => item.subjectSlug !== result.subjectSlug)
      : []

    localStorage.setItem(QUIZ_RESULTS_STORAGE_KEY, JSON.stringify([...filteredResults, result]))
  } catch {
    // Ignore storage failures silently so quiz UX still works.
  }
}

function SubjectQuestionsPage() {
  const { subjectSlug } = useParams()
  const subject = getSubjectBySlug(subjectSlug)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startedAt, setStartedAt] = useState(() => Date.now())

  if (!subject) {
    return <Navigate to="/" replace />
  }

  const totalQuestions = subject.questions.length
  const answeredCount = Object.keys(answers).length
  const isComplete = answeredCount === totalQuestions

  const score = useMemo(
    () =>
      subject.questions.reduce((count, question, questionIndex) => {
        return answers[questionIndex] === question.correctAnswer ? count + 1 : count
      }, 0),
    [answers, subject.questions],
  )

  const handleAnswerChange = (questionIndex, optionIndex) => {
    if (submitted) {
      return
    }

    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }))
  }

  const handleSubmit = async () => {
    if (!isComplete) {
      return
    }

    setSubmitError('')
    setIsSubmitting(true)

    const percentage = Math.round((score / totalQuestions) * 100)
    const normalizedAnswers = Array.from({ length: totalQuestions }, (_, index) => {
      const value = answers[index]
      return Number.isInteger(value) ? value : null
    })
    const timeTaken = Math.max(1, Math.round((Date.now() - startedAt) / 1000))

    saveQuizResult({
      subjectSlug: subject.slug,
      subjectName: subject.name,
      marks: score,
      total: totalQuestions,
      percentage,
      completedAt: new Date().toISOString(),
    })

    try {
      await submitSubjectQuiz({
        subjectSlug: subject.slug,
        answers: normalizedAnswers,
        userId: ACTIVE_STUDENT_ID,
        timeTaken,
      })
    } catch {
      setSubmitError('Quiz submitted locally, but database sync failed. Please try again later.')
    }

    setSubmitted(true)
    setIsSubmitting(false)
  }

  const handleRetake = () => {
    setAnswers({})
    setSubmitted(false)
    setSubmitError('')
    setIsSubmitting(false)
    setStartedAt(Date.now())
  }

  return (
    <div className="subjects-page">
      <section className="card">
        <div className="card-header">
          <h3>{subject.name} - 10 MCQ Questions</h3>
          <div className="portfolio-header-actions">
            <Link to="/" className="inline-nav-link">
              Subject Categories
            </Link>
            <Link to="/dashboard" className="inline-nav-link">
              Dashboard
            </Link>
          </div>
        </div>
        <p className="section-intro">Select one answer for each question and submit to see your marks out of 10.</p>
        <div className="quiz-progress">Completed: {answeredCount} / {totalQuestions}</div>
      </section>

      <section className="card subject-questions-card">
        <ol className="mcq-list">
          {subject.questions.map((question, questionIndex) => (
            <li key={question.question} className="mcq-item">
              <p className="mcq-question">{question.question}</p>
              <div className="mcq-options">
                {question.options.map((option, optionIndex) => {
                  const isSelected = answers[questionIndex] === optionIndex
                  const isCorrectOption = question.correctAnswer === optionIndex
                  const showCorrect = submitted && isCorrectOption
                  const showIncorrect = submitted && isSelected && !isCorrectOption

                  const optionClassName = [
                    'mcq-option',
                    isSelected ? 'selected' : '',
                    showCorrect ? 'correct' : '',
                    showIncorrect ? 'incorrect' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')

                  return (
                    <label key={option} className={optionClassName}>
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(questionIndex, optionIndex)}
                        disabled={submitted}
                      />
                      <span>{option}</span>
                    </label>
                  )
                })}
              </div>
            </li>
          ))}
        </ol>

        <div className="quiz-actions">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isComplete || submitted || isSubmitting}
            className="quiz-submit-btn"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
          <button type="button" onClick={handleRetake} className="quiz-retake-btn">
            Retake Quiz
          </button>
        </div>

        {submitError && <p className="course-empty">{submitError}</p>}

        {submitted && (
          <div className="quiz-result">
            <strong>
              Your marks: {score} / {totalQuestions}
            </strong>
            <span>{score >= 8 ? 'Excellent work!' : score >= 5 ? 'Good effort, keep improving!' : 'Keep practicing to improve your score.'}</span>
          </div>
        )}
      </section>
    </div>
  )
}

export default SubjectQuestionsPage
