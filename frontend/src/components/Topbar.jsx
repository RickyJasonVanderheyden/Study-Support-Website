function Topbar({ title }) {
  return (
    <header className="topbar">
      <button type="button" className="topbar-pill">
        {title}
      </button>
      <div className="searchbox">
        <span>🔎</span>
        <input type="text" placeholder="Search subject, lecture or quiz" />
      </div>
      <div className="user-info">
        <span className="notification">🔔</span>
      </div>
    </header>
  )
}

export default Topbar