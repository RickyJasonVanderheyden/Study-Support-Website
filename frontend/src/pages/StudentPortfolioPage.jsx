import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import StudentInfoCard from '../components/StudentInfoCard'
import PercentageChartList from '../components/PercentageChartList'
import StudyTracker from '../components/StudyTracker'

function StudentPortfolioPage() {
  const student = {
    id: 'STU-2026-048',
    name: 'Nethmi Silva',
    initials: 'NS',
    grade: 'Grade 09 • Science Stream',
    attendance: 96,
    mentor: 'Amjad Hussain',
    lastReachout: 'Mar 26, 2026',
  }

  const marks = [
    { label: 'Math Term Test', value: 92 },
    { label: 'Science Lab Report', value: 89 },
    { label: 'English Essay', value: 86 },
    { label: 'ICT Practical', value: 94 },
  ]

  const quizMarks = [
    { label: 'Algebra Quiz 4', value: 90 },
    { label: 'Cell Biology Quiz 2', value: 84 },
    { label: 'Grammar Quiz 6', value: 78 },
    { label: 'Physics Motion Quiz', value: 88 },
  ]

  const lectureProgress = [
    { label: 'Linear Equations Videos', value: 95 },
    { label: 'Human Anatomy Playlist', value: 83 },
    { label: 'Grammar Correction Series', value: 76 },
    { label: 'Energy and Work Playlist', value: 91 },
  ]

  const mappingProgress = [
    { label: 'Concept Mapping', value: 87 },
    { label: 'Reference Mapping', value: 80 },
    { label: 'Exam Keyword Mapping', value: 74 },
    { label: 'Practical Mapping', value: 82 },
  ]

  const trackerItems = [
    {
      topic: 'Math Revision',
      note: 'Completed chapter exercises and submitted worksheet.',
      status: 'On Track',
      progress: 93,
    },
    {
      topic: 'Science Reachout',
      note: 'Attended mentoring call and clarified 5 doubts.',
      status: 'On Track',
      progress: 88,
    },
    {
      topic: 'English Assignment',
      note: 'Draft submitted, awaiting final grammar corrections.',
      status: 'Needs Review',
      progress: 68,
    },
  ]

  return (
    <div className="portfolio-grid student-portfolio-grid">
      <section className="card student-portfolio-top">
        <div className="card-header">
          <h3>Student Portfolio</h3>
          <div className="portfolio-header-actions">
            <Link to="/dashboard" className="inline-nav-link">
              Dashboard
            </Link>
            <Link to="/learning-insights" className="inline-nav-link">
              Learning Insights
            </Link>
            <Link to="/reachouts" className="inline-nav-link">
              Reachouts
            </Link>
          </div>
        </div>
        <div className="stat-grid">
          <StatCard label="Overall Marks" value="90%" detail="Based on 4 core subjects" />
          <StatCard label="Quiz Average" value="85%" detail="Latest quiz cycle" />
          <StatCard label="Reachouts" value="12" detail="Mentor sessions this month" />
          <StatCard label="Completion" value="89%" detail="Lecture + assignment tracker" />
        </div>
      </section>

      <StudentInfoCard student={student} />

      <PercentageChartList
        title="Student Marks Chart"
        subtitle="Assessment Percentage"
        items={marks}
        colorClass="green"
      />

      <PercentageChartList
        title="Quiz Marks"
        subtitle="Quiz Performance"
        items={quizMarks}
        colorClass="yellow"
      />

      <PercentageChartList
        title="Lecture Video Progression"
        subtitle="Completion Percentage"
        items={lectureProgress}
        colorClass="blue"
      />

      <PercentageChartList
        title="Mapping Referring (%)"
        subtitle="Knowledge Mapping"
        items={mappingProgress}
        colorClass="green"
      />

      <StudyTracker items={trackerItems} />

      <section className="card insights-wide-card">
        <div className="card-header">
          <h3>Momentum Snapshot</h3>
          <span>Trend Boosters</span>
        </div>
        <div className="trendy-grid">
          <article className="trendy-tile">
            <h4>Quiz Confidence</h4>
            <p>Performance remains above 85% for 3 continuous cycles.</p>
          </article>
          <article className="trendy-tile">
            <h4>Lecture Completion</h4>
            <p>Video completion velocity improved by 12% this month.</p>
          </article>
          <article className="trendy-tile">
            <h4>Mentor Support</h4>
            <p>Reachout resolution time reduced to under 15 minutes average.</p>
          </article>
        </div>
      </section>
    </div>
  )
}

export default StudentPortfolioPage