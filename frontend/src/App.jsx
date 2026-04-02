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

function AppLayout() {
  const location = useLocation()
  const pageTitleByPath = {
    '/': 'Subject Categories',
    '/dashboard': 'Dashboard',
    '/student-portfolio': 'Student Portfolio',
    '/learning-insights': 'Learning Insights',
    '/reachouts': 'Reachouts',
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
