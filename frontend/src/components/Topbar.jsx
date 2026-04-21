function Topbar({ title }) {
  return (
    <header className="topbar">
      <button type="button" className="topbar-pill">
        {title}
      </button>
      <div className="user-info">
        <span className="notification">🔔</span>
      </div>
    </header>
  )
}

export default Topbar