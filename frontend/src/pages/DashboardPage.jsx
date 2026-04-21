import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchQuizAttempts } from '../utils/quizAttemptsApi'

const ACTIVE_STUDENT_ID = import.meta.env.VITE_STUDENT_ID || ''

function getProgressClass(percentage) {
  if (percentage >= 85) return 'green'
  if (percentage >= 70) return 'blue'
  return 'yellow'
}

function DashboardPage() {
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date())
  const [quizAttempts, setQuizAttempts] = useState([])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 60_000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadAttempts = async () => {
      try {
        const attempts = await fetchQuizAttempts({ userId: ACTIVE_STUDENT_ID || undefined })
        if (isMounted) {
          setQuizAttempts(attempts)
        }
      } catch {
        if (isMounted) {
          setQuizAttempts([])
        }
      }
    }

    loadAttempts()
    window.addEventListener('focus', loadAttempts)

    return () => {
      isMounted = false
      window.removeEventListener('focus', loadAttempts)
    }
  }, [])

  const courseSummaries = useMemo(() => {
    const summaryMap = new Map()

    quizAttempts.forEach((attempt) => {
      const existing = summaryMap.get(attempt.subjectKey)

      if (!existing) {
        summaryMap.set(attempt.subjectKey, {
          key: attempt.subjectKey,
          name: attempt.subjectName,
          percentage: attempt.percentage,
          completedAt: attempt.completedAt,
          attempts: 1,
        })
        return
      }

      const existingDate = existing.completedAt ? new Date(existing.completedAt).getTime() : 0
      const currentDate = attempt.completedAt ? new Date(attempt.completedAt).getTime() : 0

      if (currentDate >= existingDate) {
        existing.percentage = attempt.percentage
        existing.completedAt = attempt.completedAt
      }

      existing.attempts += 1
    })

    return Array.from(summaryMap.values()).sort((a, b) => b.percentage - a.percentage)
  }, [quizAttempts])

  const studyTimeline = useMemo(
    () =>
      quizAttempts.slice(0, 6).map((attempt) => ({
        task: `${attempt.quizTitle} Attempt`,
        subject: attempt.subjectName,
        dueDate: attempt.completedAt
          ? new Date(attempt.completedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })
          : 'N/A',
        score: `${attempt.percentage}%`,
        status: attempt.status?.toLowerCase() === 'completed' ? 'Completed' : 'Pending',
      })),
    [quizAttempts],
  )

  const quizAttemptRows = useMemo(
    () =>
      quizAttempts.slice(0, 10).map((attempt) => ({
        id: attempt.id,
        student: attempt.user ? String(attempt.user) : 'Guest Student',
        quizTitle: attempt.quizTitle,
        subject: attempt.subjectName,
        marks: `${attempt.marks}/${attempt.total}`,
        percentage: `${attempt.percentage}%`,
        timeTaken: `${attempt.timeTaken || 0}s`,
        completedAt: attempt.completedAt
          ? new Date(attempt.completedAt).toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'N/A',
      })),
    [quizAttempts],
  )

  const mcqPercentage = useMemo(() => {
    const totalMarks = quizAttempts.reduce((sum, attempt) => sum + attempt.marks, 0)
    const totalQuestions = quizAttempts.reduce((sum, attempt) => sum + attempt.total, 0)

    if (totalQuestions === 0) return 0
    return Math.round((totalMarks / totalQuestions) * 100)
  }, [quizAttempts])

  const currentMonthLabel = currentDateTime.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const currentYear = currentDateTime.getFullYear()
  const currentMonth = currentDateTime.getMonth()
  const todayDate = currentDateTime.getDate()
  const firstDayOffset = new Date(currentYear, currentMonth, 1).getDay()
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const markedDays = useMemo(() => {
    const marksSet = new Set()

    studyTimeline.forEach((timelineItem) => {
      const parsedDate = new Date(timelineItem.dueDate)
      if (
        !Number.isNaN(parsedDate.getTime()) &&
        parsedDate.getFullYear() === currentYear &&
        parsedDate.getMonth() === currentMonth
      ) {
        marksSet.add(parsedDate.getDate())
      }
    })

    return marksSet
  }, [studyTimeline, currentYear, currentMonth])

  return (
    <div className="content-grid">
      <section className="welcome card">
        <div className="welcome-header">
          <h2>Nethmi Silva - Student Dashboard</h2>
          <Link to="/student-portfolio" className="welcome-nav-btn">
            Open Student Portfolio
          </Link>
        </div>
        <p>Track marks, reachouts, quiz performance, and lecture progression for this student.</p>
        <div className="dashboard-nav-row">
          <Link to="/student-portfolio" className="inline-nav-link light">
            Student Portfolio
          </Link>
          <Link to="/learning-insights" className="inline-nav-link light">
            Learning Insights
          </Link>
          <Link to="/reachouts" className="inline-nav-link light">
            Reachouts Center
          </Link>
        </div>
        <div className="mini-stats">
          <div>
            <strong>{mcqPercentage}%</strong>
            <span>MCQ Marks</span>
          </div>
          <div>
            <strong>96%</strong>
            <span>Attendance</span>
          </div>
          <div>
            <strong>{quizAttempts.length}</strong>
            <span>Quiz Attempts</span>
          </div>
        </div>
      </section>

      <section className="calendar card">
        <div className="card-header">
          <h3>{currentMonthLabel}</h3>
          <span>● ● ●</span>
        </div>
        <div className="calendar-grid">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <span key={`${day}-${index}`} className="day-label">
              {day}
            </span>
          ))}
          {Array.from({ length: firstDayOffset }, (_, index) => (
            <span key={`empty-${index}`} className="day-cell empty" aria-hidden="true" />
          ))}
          {Array.from({ length: daysInCurrentMonth }, (_, index) => {
            const day = index + 1
            const isMarked = markedDays.has(day)
            const isToday = day === todayDate

            return (
              <button
                key={day}
                type="button"
                className={`day-cell ${isMarked ? 'marked' : ''} ${isToday ? 'today' : ''}`.trim()}
              >
                {day}
              </button>
            )
          })}
        </div>
      </section>

      <section className="activity card">
        <div className="card-header">
          <h3>My Activity</h3>
          <span>This Week</span>
        </div>
        <div className="chart">
          <svg viewBox="0 0 320 120" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#1f5f3b"
              strokeWidth="4"
              points="0,90 40,70 80,85 120,50 160,60 200,30 240,45 280,20 320,40"
            />
          </svg>
          <div className="chart-labels">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </section>

      <section className="courses card">
        <div className="card-header">
          <h3>My Courses</h3>
          <span>See all</span>
        </div>
        <div className="course-list">
          {courseSummaries.length > 0 ? (
            courseSummaries.map((course) => (
              <div key={course.key} className="course-row">
                <span>{course.name}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${getProgressClass(course.percentage)}`}
                    style={{ width: `${course.percentage}%` }}
                  />
                </div>
                <span>{course.percentage}%</span>
              </div>
            ))
          ) : (
            <p className="course-empty">No quiz attempts found for this student yet.</p>
          )}
        </div>
      </section>

      <section className="payments card">
        <div className="card-header">
          <h3>Subject Marks</h3>
          <span>Current Term</span>
        </div>
        <div className="payment-list">
          {courseSummaries.slice(0, 3).map((course) => (
            <div key={`mark-${course.key}`}>
              <span>{course.name}</span>
              <strong>{course.percentage}%</strong>
            </div>
          ))}
          {courseSummaries.length === 0 && (
            <div>
              <span>No subject marks yet</span>
              <strong>0%</strong>
            </div>
          )}
        </div>
      </section>

      <section className="card dashboard-trendy class-table">
        <div className="card-header">
          <h3>Trendy Learning Widgets</h3>
          <span>Quick Panels</span>
        </div>
        <div className="trendy-grid">
          <article className="trendy-tile">
            <h4>Streak Pulse</h4>
            <p>8-day active learning streak with 91% consistency.</p>
            <Link to="/learning-insights" className="inline-nav-link">
              View Insights
            </Link>
          </article>
          <article className="trendy-tile">
            <h4>Reachout Priority</h4>
            <p>2 follow-up mentor responses pending this week.</p>
            <Link to="/reachouts" className="inline-nav-link">
              Open Reachouts
            </Link>
          </article>
          <article className="trendy-tile">
            <h4>Portfolio Snapshot</h4>
            <p>Quiz average up by 4% from last cycle.</p>
            <Link to="/student-portfolio" className="inline-nav-link">
              Open Portfolio
            </Link>
          </article>
        </div>
      </section>

      <section className="card dashboard-trendy insights-wide-card">
        <div className="card-header">
          <h3>Enhance Your Learning</h3>
          <span>New Features</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          <Link to="/performance-analytics" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: '#f9fcf6',
                border: '1px solid #d6e4d5',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#1f5f3b'
                e.currentTarget.style.background = '#e8f4ea'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#d6e4d5'
                e.currentTarget.style.background = '#f9fcf6'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>📊</div>
              <h4 style={{ margin: '0 0 4px', fontSize: '12px', color: '#1f5f3b', fontWeight: '600' }}>
                Analytics
              </h4>
              <p style={{ margin: '0', fontSize: '10px', color: '#738dab' }}>Performance data</p>
            </div>
          </Link>
          <Link to="/study-time-tracker" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: '#f9fcf6',
                border: '1px solid #d6e4d5',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#1f5f3b'
                e.currentTarget.style.background = '#e8f4ea'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#d6e4d5'
                e.currentTarget.style.background = '#f9fcf6'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>⏱️</div>
              <h4 style={{ margin: '0 0 4px', fontSize: '12px', color: '#1f5f3b', fontWeight: '600' }}>
                Time Tracker
              </h4>
              <p style={{ margin: '0', fontSize: '10px', color: '#738dab' }}>Study duration</p>
            </div>
          </Link>
          <Link to="/achievements" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: '#f9fcf6',
                border: '1px solid #d6e4d5',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#1f5f3b'
                e.currentTarget.style.background = '#e8f4ea'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#d6e4d5'
                e.currentTarget.style.background = '#f9fcf6'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>🏆</div>
              <h4 style={{ margin: '0 0 4px', fontSize: '12px', color: '#1f5f3b', fontWeight: '600' }}>
                Badges
              </h4>
              <p style={{ margin: '0', fontSize: '10px', color: '#738dab' }}>Achievements</p>
            </div>
          </Link>
          <Link to="/assignments" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: '#f9fcf6',
                border: '1px solid #d6e4d5',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#1f5f3b'
                e.currentTarget.style.background = '#e8f4ea'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#d6e4d5'
                e.currentTarget.style.background = '#f9fcf6'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>📝</div>
              <h4 style={{ margin: '0 0 4px', fontSize: '12px', color: '#1f5f3b', fontWeight: '600' }}>
                Assignments
              </h4>
              <p style={{ margin: '0', fontSize: '10px', color: '#738dab' }}>Tasks & homework</p>
            </div>
          </Link>
          <Link to="/study-goals" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: '#f9fcf6',
                border: '1px solid #d6e4d5',
                borderRadius: '10px',
                padding: '12px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#1f5f3b'
                e.currentTarget.style.background = '#e8f4ea'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#d6e4d5'
                e.currentTarget.style.background = '#f9fcf6'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '6px' }}>🎯</div>
              <h4 style={{ margin: '0 0 4px', fontSize: '12px', color: '#1f5f3b', fontWeight: '600' }}>
                Goals
              </h4>
              <p style={{ margin: '0', fontSize: '10px', color: '#738dab' }}>Learning targets</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="class-table card">
        <div className="card-header">
          <h3>Study Timeline</h3>
          <span>View all</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Subject</th>
                <th>Due Date</th>
                <th>Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {studyTimeline.map((row) => (
                <tr key={`${row.task}-${row.dueDate}`}>
                  <td>{row.task}</td>
                  <td>{row.subject}</td>
                  <td>{row.dueDate}</td>
                  <td>{row.score}</td>
                  <td>
                    <span className={`status ${row.status === 'Completed' ? 'ok' : 'pending'}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {studyTimeline.length === 0 && (
                <tr>
                  <td colSpan={5}>No attempts yet for this student.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="class-table card">
        <div className="card-header">
          <h3>Quiz Attempts (MongoDB)</h3>
          <span>Latest 10</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Attempt ID</th>
                <th>Student</th>
                <th>Quiz</th>
                <th>Subject</th>
                <th>Marks</th>
                <th>Percentage</th>
                <th>Time</th>
                <th>Completed At</th>
              </tr>
            </thead>
            <tbody>
              {quizAttemptRows.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.id.slice(-8)}</td>
                  <td>{attempt.student}</td>
                  <td>{attempt.quizTitle}</td>
                  <td>{attempt.subject}</td>
                  <td>{attempt.marks}</td>
                  <td>{attempt.percentage}</td>
                  <td>{attempt.timeTaken}</td>
                  <td>{attempt.completedAt}</td>
                </tr>
              ))}
              {quizAttemptRows.length === 0 && (
                <tr>
                  <td colSpan={8}>No quiz attempts found in study-support-db.quizattempts.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage