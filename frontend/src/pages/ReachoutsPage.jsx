import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'

function ReachoutsPage() {
  const sessions = [
    {
      date: 'Mar 26, 2026',
      mentor: 'Amjad Hussain',
      mode: 'Video Call',
      topic: 'Science quiz confidence boost',
      outcome: 'Completed',
    },
    {
      date: 'Mar 22, 2026',
      mentor: 'Nadeesha Perera',
      mode: 'Chat',
      topic: 'Essay structure corrections',
      outcome: 'Completed',
    },
    {
      date: 'Mar 18, 2026',
      mentor: 'Amjad Hussain',
      mode: 'In-App Call',
      topic: 'Math speed strategy',
      outcome: 'Follow-up',
    },
  ]

  const followups = [
    { label: 'Open Reachouts', value: 3 },
    { label: 'Resolved This Month', value: 9 },
    { label: 'Satisfaction Score', value: '4.8/5' },
    { label: 'Avg Response Time', value: '12m' },
  ]

  const actionFlow = [
    { label: 'New Ticket', value: 100 },
    { label: 'Mentor Reply', value: 92 },
    { label: 'Student Acknowledged', value: 84 },
    { label: 'Closed With Notes', value: 78 },
  ]

  return (
    <div className="portfolio-grid">
      <section className="card">
        <div className="card-header">
          <h3>Reachouts Center</h3>
          <div className="portfolio-header-actions">
            <Link to="/dashboard" className="inline-nav-link">
              Dashboard
            </Link>
            <Link to="/student-portfolio" className="inline-nav-link">
              Student Portfolio
            </Link>
          </div>
        </div>
        <div className="stat-grid">
          {followups.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} detail="Single student support" />
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Support Flow Tracker</h3>
          <span>Conversion (%)</span>
        </div>
        <div className="progress-list">
          {actionFlow.map((step) => (
            <div key={step.label} className="progress-row">
              <span>{step.label}</span>
              <div className="bar-track">
                <div className="bar-fill blue" style={{ width: `${step.value}%` }} />
              </div>
              <strong>{step.value}%</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <h3>Reachout Templates</h3>
          <span>Quick Send</span>
        </div>
        <ul className="insight-list">
          <li>Need help with this lecture section? Share your timestamp and doubt.</li>
          <li>Great progress this week. Let’s schedule a 10-minute quiz prep reachout.</li>
          <li>Your mapping score dropped. Do you want a guided revision checklist?</li>
        </ul>
      </section>

      <section className="class-table card insights-wide-card">
        <div className="card-header">
          <h3>Recent Reachouts</h3>
          <span>Latest 3</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Mentor</th>
                <th>Mode</th>
                <th>Topic</th>
                <th>Outcome</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((row) => (
                <tr key={`${row.date}-${row.topic}`}>
                  <td>{row.date}</td>
                  <td>{row.mentor}</td>
                  <td>{row.mode}</td>
                  <td>{row.topic}</td>
                  <td>
                    <span className={`status ${row.outcome === 'Completed' ? 'ok' : 'pending'}`}>{row.outcome}</span>
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

export default ReachoutsPage
