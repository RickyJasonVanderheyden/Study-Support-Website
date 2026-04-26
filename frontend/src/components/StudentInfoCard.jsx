function StudentInfoCard({ student }) {
  return (
    <section className="card student-info-card">
      <div className="student-id-row">
        <div className="student-avatar">{student.initials}</div>
        <div>
          <h3>{student.name}</h3>
          <p>{student.grade}</p>
        </div>
      </div>
      <div className="student-meta-grid">
        <div>
          <span>Student ID</span>
          <strong>{student.id}</strong>
        </div>
        <div>
          <span>Attendance</span>
          <strong>{student.attendance}%</strong>
        </div>
        <div>
          <span>Mentor</span>
          <strong>{student.mentor}</strong>
        </div>
        <div>
          <span>Last Reachout</span>
          <strong>{student.lastReachout}</strong>
        </div>
      </div>
    </section>
  )
}

export default StudentInfoCard