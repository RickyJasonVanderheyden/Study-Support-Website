function StudyTracker({ items }) {
  return (
    <section className="card study-tracker-card">
      <div className="card-header">
        <h3>Study Tracker</h3>
        <span>Current Week</span>
      </div>
      <div className="tracker-list">
        {items.map((item) => (
          <div key={item.topic} className="tracker-item">
            <div>
              <h4>{item.topic}</h4>
              <p>{item.note}</p>
            </div>
            <div className="tracker-metrics">
              <span className={`status ${item.status === 'On Track' ? 'ok' : 'pending'}`}>{item.status}</span>
              <strong>{item.progress}%</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default StudyTracker