import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import StatCard from '../components/StatCard'
import StudentInfoCard from '../components/StudentInfoCard'
import PercentageChartList from '../components/PercentageChartList'
import StudyTracker from '../components/StudyTracker'
import { fetchPeerSessions, fetchQuizAttempts } from '../utils/quizAttemptsApi'

const ACTIVE_STUDENT_ID = import.meta.env.VITE_STUDENT_ID || ''

function StudentPortfolioPage() {
  const [quizAttempts, setQuizAttempts] = useState([])
  const [peerSessions, setPeerSessions] = useState([])

  useEffect(() => {
    let isMounted = true

    const loadAttempts = async () => {
      try {
        const attempts = await fetchQuizAttempts({ userId: ACTIVE_STUDENT_ID || undefined })
        if (isMounted) {
          setQuizAttempts(attempts)
        }
      } catch {
        if (isMounted) {
          setQuizAttempts([])
        }
      }
    }

    const loadPeerSessions = async () => {
      try {
        const sessions = await fetchPeerSessions({ userId: ACTIVE_STUDENT_ID || undefined })
        if (isMounted) {
          setPeerSessions(sessions)
        }
      } catch {
        if (isMounted) {
          setPeerSessions([])
        }
      }
    }

    loadAttempts()
    loadPeerSessions()
    window.addEventListener('focus', loadAttempts)
    window.addEventListener('focus', loadPeerSessions)

    return () => {
      isMounted = false
      window.removeEventListener('focus', loadAttempts)
      window.removeEventListener('focus', loadPeerSessions)
    }
  }, [])

  const student = {
    id: 'STU-2026-048',
    name: 'Nethmi Silva',
    initials: 'NS',
    grade: 'Grade 09 • Science Stream',
    attendance: 96,
    mentor: 'Amjad Hussain',
    lastReachout: 'Mar 26, 2026',
  }

  const groupedSubjectMarks = useMemo(() => {
    const subjectMap = new Map()

    quizAttempts.forEach((attempt) => {
      const existing = subjectMap.get(attempt.subjectKey)

      if (!existing) {
        subjectMap.set(attempt.subjectKey, {
          subjectName: attempt.subjectName,
          totalPercentage: attempt.percentage,
          count: 1,
          lastPercentage: attempt.percentage,
          lastCompletedAt: attempt.completedAt,
        })
        return
      }

      existing.totalPercentage += attempt.percentage
      existing.count += 1

      const existingDate = existing.lastCompletedAt ? new Date(existing.lastCompletedAt).getTime() : 0
      const currentDate = attempt.completedAt ? new Date(attempt.completedAt).getTime() : 0
      if (currentDate >= existingDate) {
        existing.lastPercentage = attempt.percentage
        existing.lastCompletedAt = attempt.completedAt
      }
    })

    return Array.from(subjectMap.values()).map((item) => ({
      label: item.subjectName,
      average: Math.round(item.totalPercentage / item.count),
      latest: item.lastPercentage,
      attempts: item.count,
    }))
  }, [quizAttempts])

  const marks = useMemo(() => {
    if (groupedSubjectMarks.length === 0) {
      return [{ label: 'No quiz data yet', value: 0 }]
    }

    return groupedSubjectMarks
      .slice()
      .sort((a, b) => b.average - a.average)
      .slice(0, 4)
      .map((item) => ({ label: item.label, value: item.average }))
  }, [groupedSubjectMarks])

  const quizMarks = useMemo(() => {
    if (quizAttempts.length === 0) {
      return [{ label: 'No attempts yet', value: 0 }]
    }

    return quizAttempts.slice(0, 4).map((attempt) => ({
      label: attempt.quizTitle,
      value: attempt.percentage,
    }))
  }, [quizAttempts])

  const mappingProgress = useMemo(() => {
    if (groupedSubjectMarks.length === 0) {
      return [{ label: 'Mapping progression pending', value: 0 }]
    }

    return groupedSubjectMarks.slice(0, 4).map((item) => ({
      label: `${item.label} Mapping`,
      value: Math.max(0, item.average - 5),
    }))
  }, [groupedSubjectMarks])

  const trackerItems = useMemo(() => {
    if (quizAttempts.length === 0) {
      return [
        {
          topic: 'No activity yet',
          note: 'Complete subject quizzes to populate student tracker insights.',
          status: 'Needs Review',
          progress: 0,
        },
      ]
    }

    return quizAttempts.slice(0, 4).map((attempt) => ({
      topic: `${attempt.quizTitle} Follow-up`,
      note: `Latest score ${attempt.marks}/${attempt.total} (${attempt.percentage}%).`,
      status: attempt.percentage >= 70 ? 'On Track' : 'Needs Review',
      progress: attempt.percentage,
    }))
  }, [quizAttempts])

  const quizAverage = useMemo(() => {
    if (quizAttempts.length === 0) return 0
    return Math.round(quizAttempts.reduce((sum, item) => sum + item.percentage, 0) / quizAttempts.length)
  }, [quizAttempts])

  const overallMarks = useMemo(() => {
    if (groupedSubjectMarks.length === 0) return 0
    return Math.round(groupedSubjectMarks.reduce((sum, item) => sum + item.average, 0) / groupedSubjectMarks.length)
  }, [groupedSubjectMarks])

  const completionRate = useMemo(() => {
    if (quizAttempts.length === 0) return 0
    const completedCount = quizAttempts.filter((item) => item.status.toLowerCase() === 'completed').length
    return Math.round((completedCount / quizAttempts.length) * 100)
  }, [quizAttempts])

  const peerSessionProgress = useMemo(() => {
    if (peerSessions.length === 0) {
      return {
        summary: [{ label: 'No peer sessions yet', value: 0 }],
        stats: {
          total: 0,
          completed: 0,
          upcoming: 0,
          averageDuration: 0,
          participationRate: 0,
        },
        tracker: [
          {
            topic: 'Peer sessions pending',
            note: 'Join sessions to track collaboration progress here.',
            status: 'Needs Review',
            progress: 0,
          },
        ],
      }
    }

    const total = peerSessions.length
    const completed = peerSessions.filter((session) => session.status === 'completed').length
    const upcoming = peerSessions.filter((session) => session.status === 'upcoming').length
    const averageDuration = Math.round(
      peerSessions.reduce((sum, session) => sum + (session.durationMinutes || 0), 0) / total,
    )
    const participationRate = Math.round((completed / total) * 100)

    return {
      summary: peerSessions.slice(0, 4).map((session) => ({
        label: session.title,
        value: session.status === 'completed' ? 100 : session.status === 'upcoming' ? 60 : 40,
      })),
      stats: {
        total,
        completed,
        upcoming,
        averageDuration,
        participationRate,
      },
      tracker: peerSessions.slice(0, 4).map((session) => ({
        topic: session.title,
        note: `${session.moduleCode || session.moduleName || 'Peer session'} • ${session.hostName || 'Host pending'}`,
        status: session.status === 'completed' ? 'On Track' : 'Needs Review',
        progress: session.status === 'completed' ? 100 : session.status === 'upcoming' ? 55 : 40,
      })),
    }
  }, [peerSessions])

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
          <StatCard label="Overall Marks" value={`${overallMarks}%`} detail="From quizattempts collection" />
          <StatCard label="Quiz Average" value={`${quizAverage}%`} detail={`${quizAttempts.length} attempts recorded`} />
          <StatCard label="Reachouts" value={String(Math.max(1, Math.round(quizAttempts.length / 2)))} detail="Auto-estimated from activity" />
          <StatCard label="Completion" value={`${completionRate}%`} detail="Completed attempts ratio" />
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
        title="Mapping Referring (%)"
        subtitle="Knowledge Mapping"
        items={mappingProgress}
        colorClass="green"
      />

      <StudyTracker items={trackerItems} />

      <PercentageChartList
        title="Peer Sessions Progress"
        subtitle="Student Collaboration"
        items={peerSessionProgress.summary}
        colorClass="blue"
      />

      <section className="card insights-wide-card">
        <div className="card-header">
          <h3>Peer Sessions Overview</h3>
          <span>Student Progress</span>
        </div>
        <div className="stat-grid">
          <StatCard label="Total Sessions" value={String(peerSessionProgress.stats.total)} detail="Mongo peersessions" />
          <StatCard label="Completed" value={String(peerSessionProgress.stats.completed)} detail="Finished sessions" />
          <StatCard label="Upcoming" value={String(peerSessionProgress.stats.upcoming)} detail="Scheduled sessions" />
          <StatCard
            label="Participation"
            value={`${peerSessionProgress.stats.participationRate}%`}
            detail={`${peerSessionProgress.stats.averageDuration} min avg duration`}
          />
        </div>
      </section>

      <StudyTracker items={peerSessionProgress.tracker} />

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