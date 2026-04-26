import { useMemo } from 'react'
import { Link } from 'react-router-dom'

const QUIZ_RESULTS_STORAGE_KEY = 'lms.quizResults'

function getStoredQuizResults() {
  try {
    const raw = localStorage.getItem(QUIZ_RESULTS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function AchievementsPage() {
  const results = getStoredQuizResults()

  const badges = useMemo(() => {
    const allBadges = [
      {
        id: 'first-quiz',
        name: 'First Steps',
        description: 'Complete your first quiz',
        icon: '🚀',
        earned: results.length >= 1,
        requirement: 'Complete 1 quiz',
      },
      {
        id: 'five-quizzes',
        name: 'Quiz Master',
        description: 'Complete 5 quizzes',
        icon: '🎯',
        earned: results.length >= 5,
        requirement: 'Complete 5 quizzes',
      },
      {
        id: 'perfect-score',
        name: 'Perfect 10',
        description: 'Score 100% on any quiz',
        icon: '⭐',
        earned: results.some((r) => r.percentage === 100),
        requirement: 'Score 100%',
      },
      {
        id: 'consistent-high',
        name: 'Consistent Learner',
        description: 'Average 80%+ across all quizzes',
        icon: '📈',
        earned:
          results.length > 0 && results.reduce((sum, r) => sum + r.percentage, 0) / results.length >= 80,
        requirement: 'Average 80%+',
      },
      {
        id: 'all-subjects',
        name: 'All-rounder',
        description: 'Complete quizzes in all 6 subjects',
        icon: '🌟',
        earned: new Set(results.map((r) => r.subjectSlug)).size === 6,
        requirement: 'Quiz all subjects',
      },
      {
        id: 'improvement',
        name: 'Rising Star',
        description: 'Show 10% improvement from first to last quiz',
        icon: '⚡',
        earned:
          results.length >= 2 && results[0].percentage - results[results.length - 1].percentage >= 10,
        requirement: '10% improvement',
      },
    ]

    return allBadges
  }, [results])

  const earnedCount = badges.filter((b) => b.earned).length

  return (
    <div className="content-grid">
      <section className="card">
        <div className="card-header">
          <h3>Achievements & Badges</h3>
          <Link to="/dashboard" className="inline-nav-link">
            Back to Dashboard
          </Link>
        </div>
        <p className="section-intro">Unlock badges by hitting learning milestones and achieving goals.</p>
      </section>

      <section className="card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div className="stat-card">
            <span>Badges Earned</span>
            <strong>{earnedCount}</strong>
            <small>of {badges.length}</small>
          </div>
          <div className="stat-card">
            <span>Progress</span>
            <strong>{Math.round((earnedCount / badges.length) * 100)}%</strong>
            <small>Achievement rate</small>
          </div>
          <div className="stat-card">
            <span>Next Badge</span>
            <strong>?</strong>
            <small>Keep learning!</small>
          </div>
        </div>
      </section>

      <section className="card insights-wide-card">
        <div className="card-header">
          <h3>Unlocked Badges</h3>
          <span>{earnedCount} earned</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
          }}
        >
          {badges
            .filter((b) => b.earned)
            .map((badge) => (
              <div
                key={badge.id}
                style={{
                  border: '1px solid #d6e4d5',
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center',
                  background: '#f3f8ee',
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '6px' }}>{badge.icon}</div>
                <h4 style={{ margin: '0 0 4px', fontSize: '13px', color: '#1f5f3b', fontWeight: '600' }}>
                  {badge.name}
                </h4>
                <p style={{ margin: '0', fontSize: '11px', color: '#738dab' }}>{badge.description}</p>
              </div>
            ))}
        </div>
      </section>

      <section className="card insights-wide-card">
        <div className="card-header">
          <h3>Locked Badges</h3>
          <span>{badges.length - earnedCount} remaining</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
          }}
        >
          {badges
            .filter((b) => !b.earned)
            .map((badge) => (
              <div
                key={badge.id}
                style={{
                  border: '1px dashed #ccc',
                  borderRadius: '10px',
                  padding: '12px',
                  textAlign: 'center',
                  background: '#f5f5f5',
                  opacity: 0.7,
                }}
              >
                <div style={{ fontSize: '36px', marginBottom: '6px', opacity: 0.5 }}>🔒</div>
                <h4 style={{ margin: '0 0 4px', fontSize: '13px', color: '#666', fontWeight: '600' }}>
                  {badge.name}
                </h4>
                <p style={{ margin: '0 0 6px', fontSize: '11px', color: '#888' }}>{badge.requirement}</p>
                <small style={{ color: '#999' }}>Locked</small>
              </div>
            ))}
        </div>
      </section>
    </div>
  )
}

export default AchievementsPage
