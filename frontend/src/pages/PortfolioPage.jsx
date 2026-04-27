import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityChart from '../components/studentDash/ActivityChart';
import CalendarCard from '../components/studentDash/CalendarCard';
import HeroSection from '../components/studentDash/HeroSection';
import PageShell from '../components/studentDash/PageShell';
import QuickActions from '../components/studentDash/QuickActions';
import QuizAttemptList from '../components/studentDash/QuizAttemptList';
import StatCard from '../components/studentDash/StatCard';
import { getPortfolio } from '../services/studentDashboardApi';

const PortfolioPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await getPortfolio();
        if (mounted) setData(response);
      } catch {
        if (mounted) setData(null);
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
      { label: 'Overall Marks', value: `${data?.stats?.overallMarks || 0}%` },
      { label: 'Quiz Average', value: `${data?.stats?.quizAverage || 0}%` },
      { label: 'Reachouts', value: String(data?.stats?.reachouts || 0) },
      { label: 'Completion', value: `${data?.stats?.completion || 0}%` },
    ],
    [data]
  );

  return (
    <PageShell
      breadcrumb="Student Portfolio"
      showPeerAndQuiz
      onPeerClick={() => navigate('/module3')}
      onQuizClick={() => navigate('/module2')}
    >
      {loading ? (
        <div className="rounded-2xl border border-[#DDE5D8] bg-white p-6 text-sm text-[#7A837A]">Loading portfolio...</div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <HeroSection
              title="Student Portfolio"
              subtitle={`A compact view of marks, learning activity, and peer collaboration for ${data?.student?.name || 'student'}.`}
              tabs={[
                { label: 'Dashboard', active: false, onClick: () => navigate('/dashboard') },
                { label: 'Learning Insights', active: false, onClick: () => navigate('/learning-insights') },
                { label: 'Reachouts', active: false, onClick: () => navigate('/reachouts') },
              ]}
              stats={stats}
            />
            <CalendarCard />
          </div>

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <ActivityChart
              points={(data?.subjectQuizMarks || []).slice(0, 7).map((row) => ({
                day: new Date(row.completedAt || Date.now()).toLocaleDateString('en-US', { weekday: 'short' }),
                percentage: row.percentage || 0,
              }))}
            />
            <section className="rounded-2xl border border-[#DDE5D8] bg-white p-5 shadow-sm shadow-black/5">
              <h3 className="text-4xl font-black text-[#173B2F]">Student Details</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <StatCard label="Student" value={data?.student?.name || '-'} />
                <StatCard label="Registration" value={data?.student?.registrationNumber || '-'} />
                <StatCard label="Group" value={data?.student?.group || '-'} />
                <StatCard label="Attendance" value={`${data?.student?.attendance || 0}%`} />
              </div>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#DDE5D8] bg-white p-5 shadow-sm shadow-black/5">
              <h3 className="text-4xl font-black text-[#173B2F]">Quiz Marks</h3>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <StatCard label="Average Score" value={`${data?.quizMarks?.averageScore || 0}%`} />
                <StatCard label="Best Score" value={`${data?.quizMarks?.bestScore || 0}%`} />
              </div>
            </section>
            <QuickActions
              items={[
                { label: 'Back to Dashboard', to: '/dashboard', primary: true },
                { label: 'Open Peer Sessions', to: '/module3' },
                { label: 'Open Quiz Builder', to: '/module2' },
              ]}
            />
          </div>

          <QuizAttemptList
            title="Subject Categories Quiz Marks"
            subtitle="Latest submitted subject quiz"
            items={data?.subjectQuizMarks || []}
          />

          <section className="rounded-2xl border border-[#DDE5D8] bg-white p-5 shadow-sm shadow-black/5">
            <div className="flex items-center justify-between">
              <h3 className="text-4xl font-black text-[#173B2F]">Study Tracker</h3>
              <span className="text-sm font-semibold text-[#7A837A]">Current Week</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <StatCard
                label="Interactive Quizzes"
                value={String(data?.studyTracker?.interactiveQuizzes?.total || 0)}
                detail="Generated and ready for attempts."
                tone="orange"
              />
              <StatCard
                label="Mind Maps"
                value={String(data?.studyTracker?.mindMaps?.total || 0)}
                detail="Visual concept maps generated."
                tone="green"
              />
            </div>
            <div className="mt-3 rounded-xl border border-[#DDE5D8] bg-[#F5F9F3] px-4 py-3 text-sm font-semibold text-[#173B2F]">
              Total study time: {data?.studyTracker?.totalStudyMinutes || 0} mins
            </div>
          </section>

          <section className="rounded-2xl border border-[#DDE5D8] bg-white p-5 shadow-sm shadow-black/5">
            <div className="flex items-center justify-between">
              <h3 className="text-4xl font-black text-[#173B2F]">Peer Sessions Progress</h3>
              <span className="text-sm font-semibold text-[#7A837A]">Student Collaboration</span>
            </div>
            <div className="mt-4 rounded-xl border border-dashed border-[#DDE5D8] bg-[#F8FBF7] p-4 text-sm text-[#7A837A]">
              {(data?.peerSessionsProgress?.total || 0) > 0
                ? `${data?.peerSessionsProgress?.total} sessions found`
                : 'No peer sessions yet.'}
            </div>
            <div className="mt-3 rounded-xl border border-[#DDE5D8] bg-[#F5F9F3] px-4 py-3 text-sm font-semibold text-[#173B2F]">
              Average peer session rating: {data?.peerSessionsProgress?.averagePeerSessionRating || 0}/5
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
};

export default PortfolioPage;
