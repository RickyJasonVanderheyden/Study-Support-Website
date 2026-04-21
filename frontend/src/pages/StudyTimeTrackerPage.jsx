import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

const STUDY_TIME_STORAGE_KEY = 'lms.studyTime'

function getStoredStudyTime() {
  try {
    const raw = localStorage.getItem(STUDY_TIME_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function StudyTimeTrackerPage() {
  const [studyTime, setStudyTime] = useState(getStoredStudyTime)
  const [currentSubject, setCurrentSubject] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)

  const subjects = ['Information Technology', 'Data Science', 'Software Engineering', 'Business Management', 'Accounting', 'Bio Chemistry']

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  const handleStartTimer = (subject) => {
    setCurrentSubject(subject)
    setTimerSeconds(0)
    setIsRunning(true)
  }

  const handleStopTimer = () => {
    if (timerSeconds > 0) {
      const minutes = Math.floor(timerSeconds / 60)
      setStudyTime((prev) => ({
        ...prev,
        [currentSubject]: (prev[currentSubject] || 0) + minutes,
      }))
      localStorage.setItem(STUDY_TIME_STORAGE_KEY, JSON.stringify(studyTime))
    }

    setIsRunning(false)
    setTimerSeconds(0)
    setCurrentSubject('')
  }

  const totalMinutes = useMemo(() => Object.values(studyTime).reduce((a, b) => a + b, 0), [studyTime])
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  const timerDisplay = useMemo(() => {
    const mins = Math.floor(timerSeconds / 60)
    const secs = timerSeconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [timerSeconds])

  return (
    <div className="content-grid">
      <section className="card">
        <div className="card-header">
          <h3>Study Time Tracker</h3>
          <Link to="/dashboard" className="inline-nav-link">
            Back to Dashboard
          </Link>
        </div>
        <p className="section-intro">Track time spent on each subject to optimize your learning schedule.</p>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Total Study Time</h3>
          <span>All subjects</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div className="stat-card">
            <span>Hours Studied</span>
            <strong>{totalHours}</strong>
            <small>Total hours</small>
          </div>
          <div className="stat-card">
            <span>Minutes</span>
            <strong>{remainingMinutes}</strong>
            <small>Additional minutes</small>
          </div>
          <div className="stat-card">
            <span>Sessions</span>
            <strong>{Object.keys(studyTime).length}</strong>
            <small>Subjects tracked</small>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Active Timer</h3>
          <span>{isRunning ? 'Running...' : 'Idle'}</span>
        </div>
        <div style={{ padding: '14px', backgroundColor: '#f9fcf6', borderRadius: '10px', textAlign: 'center' }}>
          {isRunning ? (
            <>
              <p style={{ margin: '0 0 8px', color: '#5f7898', fontSize: '12px' }}>Studying: {currentSubject}</p>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#1f5f3b', marginBottom: '12px' }}>{timerDisplay}</div>
              <button
                type="button"
                onClick={handleStopTimer}
                style={{
                  background: '#cd5c5c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Stop & Save
              </button>
            </>
          ) : (
            <p style={{ color: '#6b7f9a', margin: '12px 0' }}>Select a subject below to start tracking study time.</p>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Subject Study Sessions</h3>
          <span>{Object.keys(studyTime).length} active</span>
        </div>
        <div className="tracker-list">
          {subjects.map((subject) => {
            const minutes = studyTime[subject] || 0
            const hours = Math.floor(minutes / 60)
            const mins = minutes % 60

            return (
              <div key={subject} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #e5edf8' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#233f64' }}>{subject}</h4>
                  <p style={{ margin: '0', fontSize: '12px', color: '#738dab' }}>
                    {hours}h {mins}m studied
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleStartTimer(subject)}
                  disabled={isRunning}
                  style={{
                    background: isRunning ? '#d0d0d0' : '#e6951a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: isRunning ? 'not-allowed' : 'pointer',
                  }}
                >
                  Start Session
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default StudyTimeTrackerPage
