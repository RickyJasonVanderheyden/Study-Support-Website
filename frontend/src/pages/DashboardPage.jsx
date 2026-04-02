import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const QUIZ_RESULTS_STORAGE_KEY = 'lms.quizResults'

function getStoredQuizResults() {
  try {
    const raw = localStorage.getItem(QUIZ_RESULTS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((entry) => entry?.subjectName && typeof entry?.percentage === 'number')
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
  } catch {
    return []
  }
}

function getProgressClass(percentage) {
  if (percentage >= 85) return 'green'
  if (percentage >= 70) return 'blue'
  return 'yellow'
}

function DashboardPage() {
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date())
  const [completedSubjects, setCompletedSubjects] = useState(() => getStoredQuizResults())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 60_000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const refreshResults = () => {
      setCompletedSubjects(getStoredQuizResults())
    }

    refreshResults()
    window.addEventListener('focus', refreshResults)
    window.addEventListener('storage', refreshResults)

    return () => {
      window.removeEventListener('focus', refreshResults)
      window.removeEventListener('storage', refreshResults)
    }
  }, [])

  const studyTimeline = [
    {
      task: 'Algebra Worksheet',
      subject: 'Mathematics',
      dueDate: 'Mar 29, 2026',
      score: '92%',
      status: 'Completed',
    },
    {
      task: 'Cell Structure Quiz',
      subject: 'Science',
      dueDate: 'Mar 30, 2026',
      score: '84%',
      status: 'Completed',
    },
    {
      task: 'Essay Draft Review',
      subject: 'English',
      dueDate: 'Apr 01, 2026',
      score: 'Pending',
      status: 'Pending',
    },
  ]

  const mcqPercentage = useMemo(() => {
    const totalMarks = completedSubjects.reduce((sum, attempt) => sum + attempt.marks, 0)
    const totalQuestions = completedSubjects.reduce((sum, attempt) => sum + attempt.total, 0)

    if (totalQuestions === 0) return 0
    return Math.round((totalMarks / totalQuestions) * 100)
  }, [completedSubjects])

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
            <strong>12</strong>
            <span>Reachouts</span>
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
          {completedSubjects.length > 0 ? (
            completedSubjects.map((course) => (
              <div key={course.subjectSlug} className="course-row">
                <span>{course.subjectName}</span>
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
            <p className="course-empty">Complete subject quizzes to see your courses here.</p>
          )}
        </div>
      </section>

      <section className="payments card">
        <div className="card-header">
          <h3>Subject Marks</h3>
          <span>Current Term</span>
        </div>
        <div className="payment-list">
          <div>
            <span>Mathematics</span>
            <strong>92%</strong>
          </div>
          <div>
            <span>Science</span>
            <strong>89%</strong>
          </div>
          <div>
            <span>English</span>
            <strong>86%</strong>
          </div>
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
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage