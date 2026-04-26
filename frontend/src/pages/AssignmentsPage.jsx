import { useState } from 'react'
import { Link } from 'react-router-dom'

function AssignmentsPage() {
  const [assignments] = useState([
    {
      id: 1,
      title: 'Data Structures & Algorithms Assignment',
      subject: 'Software Engineering',
      dueDate: '2026-04-15',
      status: 'pending',
      description: 'Implement sorting algorithms and analyze their time complexity.',
    },
    {
      id: 2,
      title: 'Business Case Study Analysis',
      subject: 'Business Management',
      dueDate: '2026-04-10',
      status: 'submitted',
      description: "Analyze a Fortune 500 company's strategic decisions.",
      submittedDate: '2026-04-08',
    },
    {
      id: 3,
      title: 'Financial Statement Review',
      subject: 'Accounting',
      dueDate: '2026-04-20',
      status: 'pending',
      description: 'Analyze quarterly financial statements and provide insights.',
    },
    {
      id: 4,
      title: 'Statistical Analysis Project',
      subject: 'Data Science',
      dueDate: '2026-04-12',
      status: 'in-progress',
      description: 'Conduct hypothesis testing on a provided dataset.',
      progress: 65,
    },
    {
      id: 5,
      title: 'Network Configuration Lab',
      subject: 'Information Technology',
      dueDate: '2026-04-18',
      status: 'pending',
      description: 'Set up and configure a virtual network infrastructure.',
    },
    {
      id: 6,
      title: 'Biochemistry Lab Report',
      subject: 'Bio Chemistry',
      dueDate: '2026-04-14',
      status: 'submitted',
      description: 'Write a comprehensive report on enzyme kinetics experiment.',
      submittedDate: '2026-04-12',
    },
  ])

  const pendingCount = assignments.filter((a) => a.status === 'pending').length
  const submittedCount = assignments.filter((a) => a.status === 'submitted').length
  const inProgressCount = assignments.filter((a) => a.status === 'in-progress').length

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return { bg: '#fff4e2', color: '#b98519' }
      case 'submitted':
        return { bg: '#e8f4ea', color: '#1f5f3b' }
      case 'in-progress':
        return { bg: '#e5efdb', color: '#314d22' }
      default:
        return { bg: '#f0f0f0', color: '#666' }
    }
  }

  const getDaysRemaining = (dueDate) => {
    const now = new Date()
    const due = new Date(dueDate)
    const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
    return days
  }

  return (
    <div className="content-grid">
      <section className="card">
        <div className="card-header">
          <h3>Assignments & Tasks</h3>
          <Link to="/dashboard" className="inline-nav-link">
            Back to Dashboard
          </Link>
        </div>
        <p className="section-intro">Track homework, projects, and assignments across all subjects.</p>
      </section>

      <section className="card">
        <div className="stat-grid">
          <div className="stat-card">
            <span>Pending</span>
            <strong style={{ color: '#d18210' }}>{pendingCount}</strong>
            <small>Due soon</small>
          </div>
          <div className="stat-card">
            <span>In Progress</span>
            <strong style={{ color: '#314d22' }}>{inProgressCount}</strong>
            <small>Working on</small>
          </div>
          <div className="stat-card">
            <span>Submitted</span>
            <strong style={{ color: '#1f5f3b' }}>{submittedCount}</strong>
            <small>Completed</small>
          </div>
          <div className="stat-card">
            <span>Total</span>
            <strong>{assignments.length}</strong>
            <small>All assignments</small>
          </div>
        </div>
      </section>

      <section className="card insights-wide-card">
        <div className="card-header">
          <h3>All Assignments</h3>
          <span>{assignments.length} total</span>
        </div>
        <div className="tracker-list">
          {assignments.map((assignment) => {
            const daysLeft = getDaysRemaining(assignment.dueDate)
            const statusStyle = getStatusColor(assignment.status)

            return (
              <div key={assignment.id} style={{ borderBottom: '1px solid #e5edf8', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#233f64', fontWeight: '600' }}>
                      {assignment.title}
                    </h4>
                    <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#738dab' }}>
                      {assignment.subject} • Due {assignment.dueDate}
                    </p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#5f7898' }}>{assignment.description}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        padding: '4px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      }}
                    >
                      {assignment.status}
                    </span>
                    {assignment.status === 'in-progress' && (
                      <div style={{ marginTop: '6px' }}>
                        <div style={{ height: '4px', background: '#e5edf8', borderRadius: '999px', width: '60px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              background: '#e6951a',
                              width: `${assignment.progress}%`,
                            }}
                          />
                        </div>
                        <small style={{ fontSize: '10px', color: '#738dab' }}>{assignment.progress}%</small>
                      </div>
                    )}
                    {daysLeft >= 0 && assignment.status !== 'submitted' && (
                      <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#d18210' }}>{daysLeft} days left</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default AssignmentsPage
