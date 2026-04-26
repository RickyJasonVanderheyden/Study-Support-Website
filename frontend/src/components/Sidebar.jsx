import { NavLink } from 'react-router-dom'

const menuItems = [
  { label: 'Subject Categories', path: '/' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Student Portfolio', path: '/student-portfolio' },
  { label: 'Performance Analytics', path: '/performance-analytics' },
  { label: 'Study Time Tracker', path: '/study-time-tracker' },
  { label: 'Achievements', path: '/achievements' },
  { label: 'Assignments', path: '/assignments' },
  { label: 'Study Goals', path: '/study-goals' },
  { label: 'Learning Insights', path: '/learning-insights' },
  { label: 'Reachouts', path: '/reachouts' },
  { label: 'Profile', path: '#' },
  { label: 'Setting', path: '#' },
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div>
          <h1 className="brand-name">LearnLoop</h1>
        </div>
      </div>

      <nav className="menu">
        {menuItems.map((item) => {
          if (item.path === '#') {
            return (
              <span key={item.label} className="menu-item muted">
                {item.label}
              </span>
            )
          }

          return (
            <NavLink
              key={item.label}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="upgrade-card">
        <div className="upgrade-graphic">📘</div>
        <p>Track performance, marks, and learning reachouts from one portfolio view.</p>
        <button type="button">Upgrade now</button>
      </div>
    </aside>
  )
}

export default Sidebar