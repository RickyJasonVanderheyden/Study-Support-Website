import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import DashboardPage from './pages/DashboardPage'
import StudentPortfolioPage from './pages/StudentPortfolioPage'
import LearningInsightsPage from './pages/LearningInsightsPage'
import ReachoutsPage from './pages/ReachoutsPage'
import SubjectCategoriesPage from './pages/SubjectCategoriesPage'
import SubjectQuestionsPage from './pages/SubjectQuestionsPage'
import PerformanceAnalyticsPage from './pages/PerformanceAnalyticsPage'
import StudyTimeTrackerPage from './pages/StudyTimeTrackerPage'
import AchievementsPage from './pages/AchievementsPage'
import AssignmentsPage from './pages/AssignmentsPage'
import StudyGoalsPage from './pages/StudyGoalsPage'

function AppLayout() {
  const location = useLocation()
  const pageTitleByPath = {
    '/': 'Subject Categories',
    '/dashboard': 'Dashboard',
    '/student-portfolio': 'Student Portfolio',
    '/learning-insights': 'Learning Insights',
    '/reachouts': 'Reachouts',
    '/performance-analytics': 'Performance Analytics',
    '/study-time-tracker': 'Study Time Tracker',
    '/achievements': 'Achievements & Badges',
    '/assignments': 'Assignments & Tasks',
    '/study-goals': 'Study Goals',
  }
  const pageTitle = location.pathname.startsWith('/subjects/')
    ? 'Subject Questions'
    : (pageTitleByPath[location.pathname] ?? 'Subject Categories')

  return (
    <main className="dashboard-shell">
      <Sidebar />
      <section className="dashboard-main">
        <Topbar title={pageTitle} />
        <Routes>
          <Route path="/" element={<SubjectCategoriesPage />} />
          <Route path="/subjects/:subjectSlug" element={<SubjectQuestionsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/student-portfolio" element={<StudentPortfolioPage />} />
          <Route path="/learning-insights" element={<LearningInsightsPage />} />
          <Route path="/reachouts" element={<ReachoutsPage />} />
          <Route path="/performance-analytics" element={<PerformanceAnalyticsPage />} />
          <Route path="/study-time-tracker" element={<StudyTimeTrackerPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/study-goals" element={<StudyGoalsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
