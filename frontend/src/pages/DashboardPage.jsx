import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityChart from '../components/studentDash/ActivityChart';
import CalendarCard from '../components/studentDash/CalendarCard';
import HeroSection from '../components/studentDash/HeroSection';
import PageShell from '../components/studentDash/PageShell';
import QuizAttemptList from '../components/studentDash/QuizAttemptList';
import { getDashboardSummary } from '../services/studentDashboardApi';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getDashboardSummary();
        if (mounted) setSummary(data);
      } catch (error) {
        if (mounted) setSummary(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(
    () => [
      { label: 'MCQ Marks', value: `${summary?.stats?.mcqMarks || 0}%` },
      { label: 'Attendance', value: `${summary?.stats?.attendance || 0}%` },
      { label: 'Quiz Attempts', value: String(summary?.stats?.quizAttempts || 0) },
    ],
    [summary]
  );

  return (
    <PageShell
      breadcrumb="Dashboard"
      showPeerAndQuiz
      onPeerClick={() => navigate('/module3')}
      onQuizClick={() => navigate('/module2')}
    >
      {loading ? (
        <div className="rounded-2xl border border-[#DDE5D8] bg-white p-8 text-sm text-[#7A837A]">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <HeroSection
              title={`${summary?.student?.name || 'Student'} - Student Dashboard`}
              subtitle="Track marks, reachouts, quiz performance, and lecture progression for this student."
              tabs={[
                { label: 'Student Portfolio', active: false, onClick: () => navigate('/portfolio') },
                { label: 'Learning Insights', active: false, onClick: () => navigate('/learning-insights') },
                { label: 'Reachouts Center', active: false, onClick: () => navigate('/reachouts') },
              ]}
              cta={
                <button
                  type="button"
                  onClick={() => navigate('/portfolio')}
                  className="rounded-xl bg-[#F2A112] px-5 py-3 text-sm font-bold text-white hover:bg-[#D98C00]"
                >
                  Open Student Portfolio
                </button>
              }
              stats={stats}
            />
            <CalendarCard />
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <ActivityChart points={summary?.activity || []} />
            <QuizAttemptList title="My Courses" subtitle="See all" items={summary?.myCourses || []} />
          </div>

          <QuizAttemptList
            title="Subject Marks"
            subtitle={`Current Term ${summary?.subjectMarks?.currentTermPercentage || 0}%`}
            items={summary?.subjectMarks?.history || []}
          />
        </>
      )}
    </PageShell>
  );
};

export default DashboardPage;
