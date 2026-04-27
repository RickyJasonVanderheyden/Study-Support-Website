import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/studentDash/HeroSection';
import PageShell from '../components/studentDash/PageShell';
import QuickActions from '../components/studentDash/QuickActions';
import { getPerformanceAnalytics } from '../services/studentDashboardApi';

const PerformanceAnalyticsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await getPerformanceAnalytics();
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

  return (
    <PageShell breadcrumb="Performance Analytics">
      {loading ? (
        <div className="rounded-2xl border border-[#DDE5D8] bg-white p-6 text-sm text-[#7A837A]">Loading analytics...</div>
      ) : (
        <>
          <HeroSection
            title="Performance Analytics"
            subtitle="Quiz patterns, subject strength, and score trends."
            color="green"
            tabs={[
              { label: 'Dashboard', active: false, onClick: () => navigate('/dashboard') },
              { label: 'Portfolio', active: false, onClick: () => navigate('/portfolio') },
            ]}
            stats={[
              { label: 'Average score', value: `${data?.stats?.averageScore || 0}%` },
              { label: 'Best score', value: `${data?.stats?.bestScore || 0}%` },
              { label: 'Attempts', value: String(data?.stats?.attempts || 0) },
              { label: 'Streak', value: `${data?.stats?.streak || 0}d` },
            ]}
            className="mb-0"
          />

          <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <section className="rounded-2xl border border-[#DDE5D8] bg-white p-5 shadow-sm shadow-black/5">
              <h3 className="text-4xl font-black text-[#173B2F]">Performance Analytics Overview</h3>
              <p className="mt-2 text-sm text-[#7A837A]">Quiz patterns, strengths, and momentum summary.</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(data?.overview || []).map((text) => (
                  <div key={text} className="rounded-xl border border-[#DDE5D8] bg-[#F5F9F3] p-3 text-sm text-[#7A837A]">
                    {text}
                  </div>
                ))}
              </div>
            </section>
            <QuickActions
              items={[
                { label: 'Back to Dashboard', to: '/dashboard', primary: true },
                { label: 'View Portfolio', to: '/portfolio' },
                { label: 'Open Peer Sessions', to: '/module3' },
              ]}
            />
          </div>
        </>
      )}
    </PageShell>
  );
};

export default PerformanceAnalyticsPage;
