function PercentageChartList({ title, subtitle, items, colorClass }) {
  return (
    <section className="card">
      <div className="card-header">
        <h3>{title}</h3>
        <span>{subtitle}</span>
      </div>
      <div className="progress-list">
        {items.map((item) => (
          <div className="progress-row" key={item.label}>
            <span>{item.label}</span>
            <div className="bar-track">
              <div className={`bar-fill ${colorClass}`} style={{ width: `${item.value}%` }} />
            </div>
            <strong>{item.value}%</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

export default PercentageChartList