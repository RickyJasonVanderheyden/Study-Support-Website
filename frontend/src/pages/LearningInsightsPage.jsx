import { Link } from 'react-router-dom'

function LearningInsightsPage() {
  const focusScores = [
    { label: 'Morning Focus', value: 91 },
    { label: 'Evening Revision', value: 84 },
    { label: 'Lecture Retention', value: 88 },
  ]

  const weeklyStreak = [72, 88, 90, 76, 93, 95, 81]

  const recommendations = [
    'Replay 1.25x on Physics: Energy and Work to improve recall.',
    'Complete 2 short quizzes before Friday to lock concept mapping.',
    'Use a 30-minute active revision block after each lecture video.',
  ]

  const skills = [
    { label: 'Problem Solving', value: 86 },
    { label: 'Concept Linking', value: 81 },
    { label: 'Speed Accuracy', value: 78 },
    { label: 'Critical Reading', value: 83 },
  ]

  return (
    <div className="portfolio-grid">
      <section className="card">
        <div className="card-header">
          <h3>Learning Insights Hub</h3>
          <div className="portfolio-header-actions">
            <Link to="/dashboard" className="inline-nav-link">
              Dashboard
            </Link>
            <Link to="/student-portfolio" className="inline-nav-link">
              Student Portfolio
            </Link>
          </div>
        </div>
        <p className="section-intro">
          Smart performance signals for one student with focus quality, retention rhythm, and suggested next
          actions.
        </p>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Focus Meter</h3>
          <span>Live Trend</span>
        </div>
        <div className="progress-list">
          {focusScores.map((item) => (
            <div className="progress-row" key={item.label}>
              <span>{item.label}</span>
              <div className="bar-track">
                <div className="bar-fill blue" style={{ width: `${item.value}%` }} />
              </div>
              <strong>{item.value}%</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Weekly Streak Heatmap</h3>
          <span>Mon - Sun</span>
        </div>
        <div className="heatmap-grid">
          {weeklyStreak.map((value, index) => (
            <div
              key={`${value}-${index}`}
              className="heatmap-cell"
              style={{ opacity: 0.28 + value / 140 }}
              title={`${value}% study intensity`}
            >
              <strong>{value}%</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>AI Recommendations</h3>
          <span>High Impact</span>
        </div>
        <ul className="insight-list">
          {recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card insights-wide-card">
        <div className="card-header">
          <h3>Skill Snapshot</h3>
          <span>Composite Metrics</span>
        </div>
        <div className="progress-list">
          {skills.map((skill) => (
            <div className="progress-row" key={skill.label}>
              <span>{skill.label}</span>
              <div className="bar-track">
                <div className="bar-fill green" style={{ width: `${skill.value}%` }} />
              </div>
              <strong>{skill.value}%</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default LearningInsightsPage
