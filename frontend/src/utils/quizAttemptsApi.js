const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || null

const FALLBACK_PORTS = [5000, 5001, 5002, 5003, 5004, 5005]

const candidateBaseUrls = API_BASE_URL
  ? [API_BASE_URL]
  : FALLBACK_PORTS.map((port) => `${window.location.protocol}//${window.location.hostname}:${port}`)

async function requestWithFallback(path, init) {
  let lastError = null

  for (const baseUrl of candidateBaseUrls) {
    try {
      return await fetch(`${baseUrl}${path}`, init)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError || new Error('Backend server is not reachable')
}

function toNumber(value, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function toSubjectName(attempt) {
  if (attempt.subjectName) {
    return attempt.subjectName
  }

  if (attempt.quizSubject) {
    return String(attempt.quizSubject)
  }

  if (attempt.subjectSlug) {
    return attempt.subjectSlug
      .split('-')
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ')
  }

  if (attempt.quiz) {
    const quizId = String(attempt.quiz)
    return `Quiz ${quizId.slice(-6)}`
  }

  return 'General Quiz'
}

function toQuizTitle(attempt) {
  if (attempt.quizTitle) {
    return String(attempt.quizTitle)
  }

  if (attempt.quiz && typeof attempt.quiz === 'object' && attempt.quiz.title) {
    return String(attempt.quiz.title)
  }

  return `${toSubjectName(attempt)} Quiz`
}

export function normalizeAttempt(attempt) {
  const total = Math.max(
    1,
    toNumber(attempt.total, 0) ||
      toNumber(attempt.quizTotalQuestions, 0) ||
      toNumber(attempt.totalQuestions, 0) ||
      (Array.isArray(attempt.answers) ? attempt.answers.length : 0) ||
      10,
  )

  const marks = Math.max(0, toNumber(attempt.score, 0))
  const percentage = Math.min(100, Math.max(0, toNumber(attempt.percentage, Math.round((marks / total) * 100))))

  return {
    id: String(attempt._id || attempt.id || Math.random()),
    user: attempt.user ?? null,
    subjectSlug: attempt.subjectSlug || null,
    subjectName: toSubjectName(attempt),
    quizTitle: toQuizTitle(attempt),
    subjectKey: attempt.subjectSlug || attempt.subjectName || String(attempt.quiz || attempt._id),
    marks,
    total,
    percentage,
    status: attempt.status || 'completed',
    completedAt: attempt.submittedAt || attempt.completedAt || attempt.createdAt || attempt.updatedAt || null,
    timeTaken: toNumber(attempt.timeTaken, 0),
  }
}

export async function fetchQuizzes() {
  const response = await requestWithFallback('/api/quizzes')

  if (!response.ok) {
    throw new Error('Failed to load quizzes')
  }

  const payload = await response.json()
  return Array.isArray(payload) ? payload : []
}

function toPeerSessionStatus(session) {
  if (session.status) {
    return String(session.status)
  }

  if (session.dateTime) {
    const sessionDate = new Date(session.dateTime)
    if (!Number.isNaN(sessionDate.getTime()) && sessionDate.getTime() >= Date.now()) {
      return 'upcoming'
    }
  }

  return 'completed'
}

function toPeerSessionTitle(session) {
  return (
    session.title ||
    [session.moduleName, session.moduleCode].filter(Boolean).join(' - ') ||
    'Peer Session'
  )
}

export function normalizePeerSession(session) {
  return {
    id: String(session._id || session.id || Math.random()),
    user: session.user ?? null,
    title: toPeerSessionTitle(session),
    moduleCode: session.moduleCode || '',
    moduleName: session.moduleName || '',
    description: session.description || '',
    hostName: session.hostName || '',
    hostEmail: session.hostEmail || '',
    meetingLink: session.meetingLink || '',
    materialsLink: session.materialsLink || '',
    dateTime: session.dateTime || session.createdAt || null,
    durationMinutes: toNumber(session.durationMinutes, 0),
    maxParticipants: toNumber(session.maxParticipants, 0),
    status: toPeerSessionStatus(session),
    createdAt: session.createdAt || null,
    updatedAt: session.updatedAt || null,
  }
}

export async function fetchPeerSessions({ userId } = {}) {
  const query = new URLSearchParams()

  if (userId) {
    query.set('userId', String(userId))
  }

  const queryString = query.toString()
  const response = await requestWithFallback(`/api/peer-sessions${queryString ? `?${queryString}` : ''}`)

  if (!response.ok) {
    throw new Error('Failed to load peer sessions')
  }

  const payload = await response.json()

  if (!Array.isArray(payload)) {
    return []
  }

  return payload.map(normalizePeerSession)
}

export async function fetchQuizAttempts({ userId } = {}) {
  const query = new URLSearchParams()

  if (userId) {
    query.set('userId', String(userId))
  }

  const queryString = query.toString()
  const response = await requestWithFallback(`/api/attempts${queryString ? `?${queryString}` : ''}`)

  if (!response.ok) {
    throw new Error('Failed to load quiz attempts')
  }

  const payload = await response.json()

  if (!Array.isArray(payload)) {
    return []
  }

  return payload.map(normalizeAttempt)
}

export async function submitSubjectQuiz({ subjectSlug, answers, userId, timeTaken }) {
  const response = await requestWithFallback(`/api/subjects/${subjectSlug}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answers, userId, timeTaken }),
  })

  if (!response.ok) {
    throw new Error('Failed to submit quiz')
  }

  return response.json()
}
