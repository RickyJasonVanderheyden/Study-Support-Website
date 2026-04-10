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

function PerformanceAnalyticsPage() {
  const results = getStoredQuizResults()

  const stats = useMemo(() => {
    if (results.length === 0) {
      return {
        avgPercentage: 0,
        totalAttempts: 0,
        highestScore: 0,
        lowestScore: 0,
        improvementRate: 0,
      }
    }

    const percentages = results.map((r) => r.percentage)
    const avgPercentage = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length)
    const highestScore = Math.max(...percentages)
    const lowestScore = Math.min(...percentages)
    const totalAttempts = results.length

    const improvementRate = results.length >= 2
      ? Math.round(((results[0].percentage - results[results.length - 1].percentage) / results[results.length - 1].percentage) * 100)
      : 0

    return {
      avgPercentage,
      totalAttempts,
      highestScore,
      lowestScore,
      improvementRate,
    }
  }, [results])

  const performanceRating = useMemo(() => {
    if (stats.avgPercentage >= 85) return { label: 'Excellent', color: '#1f5f3b' }
    if (stats.avgPercentage >= 70) return { label: 'Good', color: '#d4a030' }
    if (stats.avgPercentage >= 50) return { label: 'Average', color: '#d18210' }
    return { label: 'Needs Improvement', color: '#cd5c5c' }
  }, [stats.avgPercentage])

  return (
    <div className="content-grid">
      <section className="card">
        <div className="card-header">
          <h3>Performance Analytics</h3>
          <Link to="/dashboard" className="inline-nav-link">
            Back to Dashboard
          </Link>
        </div>
        <p className="section-intro">Track your quiz performance metrics and overall progress trends.</p>
      </section>

      <section className="card">
        <div className="stat-grid">
          <div className="stat-card">
            <span>Average Score</span>
            <strong style={{ color: performanceRating.color }}>{stats.avgPercentage}%</strong>
            <small>{performanceRating.label}</small>
          </div>
          <div className="stat-card">
            <span>Total Attempts</span>
            <strong>{stats.totalAttempts}</strong>
            <small>Quizzes completed</small>
          </div>
          <div className="stat-card">
            <span>Highest Score</span>
            <strong>{stats.highestScore}%</strong>
            <small>Best performance</small>
          </div>
          <div className="stat-card">
            <span>Lowest Score</span>
            <strong>{stats.lowestScore}%</strong>
            <small>Room to improve</small>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Subject-wise Performance</h3>
          <span>All attempts</span>
        </div>
        <div className="performance-table">
          {results.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, idx) => (
                  <tr key={idx}>
                    <td>{result.subjectName}</td>
                    <td>
                      {result.marks}/{result.total}
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '999px',
                          backgroundColor: result.percentage >= 70 ? '#e8f4ea' : '#fff4e2',
                          color: result.percentage >= 70 ? '#1f5f3b' : '#b98519',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        {result.percentage}%
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#7f97b4' }}>
                      {new Date(result.completedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: '#6b7f9a', fontSize: '13px', margin: '10px 0' }}>
              No quiz attempts yet. Start a subject quiz to see your performance data.
            </p>
          )}
        </div>
      </section>

      <section className="card insights-wide-card">
        <div className="card-header">
          <h3>Insights & Recommendations</h3>
          <span>AI-generated</span>
        </div>
        <ul className="insight-list">
          {stats.avgPercentage >= 85 ? (
            <>
              <li>Excellent! You're performing consistently above 85%. Keep up the momentum!</li>
              <li>Consider challenging yourself with advanced topics or peer mentoring.</li>
            </>
          ) : stats.avgPercentage >= 70 ? (
            <>
              <li>Good progress! Your average is solid. Focus on the lower-scoring subjects.</li>
              <li>Review quiz questions where you made mistakes to strengthen weak areas.</li>
            </>
          ) : (
            <>
              <li>You have potential! Increase study frequency and focus on fundamentals.</li>
              <li>Spend more time on challenging topics before attempting quizzes.</li>
            </>
          )}
          <li>Track your time spent per subject to optimize your study schedule.</li>
        </ul>
      </section>
    </div>
  )
}

export default PerformanceAnalyticsPage
