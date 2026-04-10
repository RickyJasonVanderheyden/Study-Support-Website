import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STUDY_GOALS_STORAGE_KEY = 'lms.studyGoals'

function getStoredGoals() {
  try {
    const raw = localStorage.getItem(STUDY_GOALS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function StudyGoalsPage() {
  const [goals, setGoals] = useState(getStoredGoals)
  const [newGoal, setNewGoal] = useState('')
  const [newTarget, setNewTarget] = useState('80')
  const [newSubject, setNewSubject] = useState('Information Technology')

  const subjects = ['Information Technology', 'Data Science', 'Software Engineering', 'Business Management', 'Accounting', 'Bio Chemistry']

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      const goal = {
        id: Date.now(),
        title: newGoal,
        subject: newSubject,
        targetPercentage: parseInt(newTarget, 10),
        createdAt: new Date().toISOString(),
        status: 'active',
      }

      const updatedGoals = [...goals, goal]
      setGoals(updatedGoals)
      localStorage.setItem(STUDY_GOALS_STORAGE_KEY, JSON.stringify(updatedGoals))
      setNewGoal('')
      setNewTarget('80')
    }
  }

  const handleCompleteGoal = (goalId) => {
    const updatedGoals = goals.map((g) =>
      g.id === goalId ? { ...g, status: 'completed', completedAt: new Date().toISOString() } : g,
    )

    setGoals(updatedGoals)
    localStorage.setItem(STUDY_GOALS_STORAGE_KEY, JSON.stringify(updatedGoals))
  }

  const handleDeleteGoal = (goalId) => {
    const updatedGoals = goals.filter((g) => g.id !== goalId)
    setGoals(updatedGoals)
    localStorage.setItem(STUDY_GOALS_STORAGE_KEY, JSON.stringify(updatedGoals))
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  return (
    <div className="content-grid">
      <section className="card">
        <div className="card-header">
          <h3>Study Goals & Learning Targets</h3>
          <Link to="/dashboard" className="inline-nav-link">
            Back to Dashboard
          </Link>
        </div>
        <p className="section-intro">Set and track learning goals to stay motivated and focused.</p>
      </section>

      <section className="card">
        <div className="stat-grid">
          <div className="stat-card">
            <span>Active Goals</span>
            <strong>{activeGoals.length}</strong>
            <small>In progress</small>
          </div>
          <div className="stat-card">
            <span>Completed</span>
            <strong>{completedGoals.length}</strong>
            <small>Achievements</small>
          </div>
          <div className="stat-card">
            <span>Total Goals</span>
            <strong>{goals.length}</strong>
            <small>All time</small>
          </div>
          <div className="stat-card">
            <span>Success Rate</span>
            <strong>{goals.length === 0 ? 0 : Math.round((completedGoals.length / goals.length) * 100)}%</strong>
            <small>Completion</small>
          </div>
        </div>
      </section>

      <section className="card insights-wide-card">
        <div className="card-header">
          <h3>Add New Goal</h3>
          <span>Set a target</span>
        </div>
        <div style={{ display: 'grid', gap: '10px' }}>
          <input
            type="text"
            placeholder="e.g., Master database design, Score 90% on Data Science quiz"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            style={{
              padding: '8px 10px',
              border: '1px solid #d6e4d5',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              style={{
                padding: '8px 10px',
                border: '1px solid #d6e4d5',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Target %"
              min="0"
              max="100"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              style={{
                padding: '8px 10px',
                border: '1px solid #d6e4d5',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleAddGoal}
            style={{
              background: '#1f5f3b',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Create Goal
          </button>
        </div>
      </section>

      {activeGoals.length > 0 && (
        <section className="card insights-wide-card">
          <div className="card-header">
            <h3>Active Goals</h3>
            <span>{activeGoals.length} to achieve</span>
          </div>
          <div className="tracker-list">
            {activeGoals.map((goal) => (
              <div key={goal.id} style={{ borderBottom: '1px solid #e5edf8', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#233f64', fontWeight: '600' }}>
                      {goal.title}
                    </h4>
                    <p style={{ margin: '0', fontSize: '12px', color: '#738dab' }}>
                      {goal.subject} — Target: {goal.targetPercentage}%
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleCompleteGoal(goal.id)}
                      style={{
                        background: '#1f5f3b',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Mark Complete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(goal.id)}
                      style={{
                        background: '#e5efdb',
                        color: '#314d22',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {completedGoals.length > 0 && (
        <section className="card insights-wide-card">
          <div className="card-header">
            <h3>Completed Goals</h3>
            <span>{completedGoals.length} achieved</span>
          </div>
          <div className="tracker-list">
            {completedGoals.map((goal) => (
              <div key={goal.id} style={{ borderBottom: '1px dashed #e5edf8', paddingBottom: '12px', marginBottom: '12px', opacity: 0.8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#1f5f3b', fontWeight: '600', textDecoration: 'line-through' }}>
                      {goal.title}
                    </h4>
                    <p style={{ margin: '0', fontSize: '12px', color: '#738dab' }}>
                      {goal.subject} — Completed {new Date(goal.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteGoal(goal.id)}
                    style={{
                      background: '#e5efdb',
                      color: '#314d22',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {goals.length === 0 && (
        <section className="card insights-wide-card">
          <p style={{ textAlign: 'center', color: '#6b7f9a', fontSize: '13px', margin: '20px 0' }}>
            No goals yet. Create one above to get started on your learning journey!
          </p>
        </section>
      )}
    </div>
  )
}

export default StudyGoalsPage
