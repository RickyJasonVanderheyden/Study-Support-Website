import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock3,
  Goal,
  GraduationCap,
  Home,
  LineChart,
  Medal,
  PanelRight,
  Sparkles,
  Target,
  Trophy,
  UserCircle2,
  Users,
} from 'lucide-react';
import API from '../services/api';
import SiteFooter from '../components/layout/SiteFooter';

const FALLBACK_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const sidebarLinks = [
  { label: 'Dashboard', to: '/dashboard', icon: Home },
  { label: 'Student Portfolio', to: '/portfolio', icon: UserCircle2 },
  { label: 'Performance Analytics', to: '/performance-analytics', icon: LineChart },
  { label: 'Study Time Tracker', to: '/study-time-tracker', icon: Clock3 },
  { label: 'Achievements', to: '/achievements', icon: Medal },
  { label: 'Assignments', to: '/assignments', icon: BookOpen },
  { label: 'Study Goals', to: '/study-goals', icon: Goal },
  { label: 'Learning Insights', to: '/learning-insights', icon: Sparkles },
  { label: 'Reachouts', to: '/reachouts', icon: Users },
  { label: 'Profile', to: '/profile', icon: UserCircle2 },
  { label: 'Setting', to: '/settings', icon: PanelRight },
];

const featureCards = [
  { title: 'Analytics', subtitle: 'Performance data', icon: LineChart },
  { title: 'Time Tracker', subtitle: 'Study duration', icon: Clock3 },
  { title: 'Badges', subtitle: 'Achievements', icon: Trophy },
  { title: 'Assignments', subtitle: 'Tasks & homework', icon: GraduationCap },
  { title: 'Goals', subtitle: 'Learning targets', icon: Target },
];

const calendarDays = Array.from({ length: 30 }, (_, i) => i + 1);

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const createPolylinePoints = (values) => {
  if (!values.length) return '0,32 100,32';

  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);

  return values
    .map((score, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 96;
      const normalized = (score - minValue) / range;
      const y = 30 - normalized * 22;
      return `${x},${y}`;
    })
    .join(' ');
};

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [progress, setProgress] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState([]);

  const studentName = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return 'Student';
      const parsed = JSON.parse(raw);
      return parsed?.name || 'Student';
    } catch {
      return 'Student';
    }
  }, []);

  const subjectQuizAttempts = useMemo(() => {
    try {
      const raw = localStorage.getItem('subjectQuizAttempts');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const activePath = location.pathname === '/module1' ? '/dashboard' : location.pathname;

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');

      const [attemptsRes, progressRes, weeklyRes] = await Promise.allSettled([
        API.get('/module2/attempts'),
        API.get('/module2/progress'),
        API.get('/module2/progress/weekly'),
      ]);

      if (attemptsRes.status === 'fulfilled') {
        setAttempts(Array.isArray(attemptsRes.value?.data?.attempts) ? attemptsRes.value.data.attempts : []);
      } else {
        setAttempts([]);
      }

      if (progressRes.status === 'fulfilled') {
        setProgress(progressRes.value?.data?.progress || null);
      } else {
        setProgress(null);
      }

      if (weeklyRes.status === 'fulfilled') {
        setWeeklyProgress(Array.isArray(weeklyRes.value?.data?.weeklyProgress) ? weeklyRes.value.data.weeklyProgress : []);
      } else {
        setWeeklyProgress([]);
      }

      if (
        attemptsRes.status === 'rejected' &&
        progressRes.status === 'rejected' &&
        weeklyRes.status === 'rejected'
      ) {
        setError('Unable to load dashboard data. Please try again.');
      }

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const averageScore = useMemo(() => {
    if (progress?.averageScore !== undefined) return progress.averageScore;
    if (!attempts.length) return 0;
    return Math.round(attempts.reduce((sum, attempt) => sum + (attempt.percentage || 0), 0) / attempts.length);
  }, [progress, attempts]);

  const attendancePct = useMemo(() => {
    if (!weeklyProgress.length) return 0;
    const activeDays = weeklyProgress.filter((day) => day.attempts > 0).length;
    return Math.round((activeDays / weeklyProgress.length) * 100);
  }, [weeklyProgress]);

  const currentWeekScores = useMemo(() => {
    if (!weeklyProgress.length) return new Array(7).fill(0);
    return weeklyProgress.map((item) => item.averageScore || 0);
  }, [weeklyProgress]);

  const activityLabels = useMemo(() => {
    if (!weeklyProgress.length) return FALLBACK_DAY_LABELS;
    return weeklyProgress.map((item) => {
      const date = new Date(item.date);
      if (Number.isNaN(date.getTime())) return 'Day';
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    });
  }, [weeklyProgress]);

  const activityLinePoints = useMemo(() => createPolylinePoints(currentWeekScores), [currentWeekScores]);

  const bestScore = useMemo(() => {
    if (!attempts.length) return 0;
    return Math.max(...attempts.map((item) => item.percentage || 0));
  }, [attempts]);

  const courses = useMemo(() => {
    const grouped = attempts.reduce((acc, attempt) => {
      const quizId = attempt.quiz?._id || 'unknown';
      if (!acc[quizId]) {
        acc[quizId] = {
          id: quizId,
          title: attempt.quiz?.title || 'Untitled Quiz',
          subject: attempt.quiz?.subject || 'General',
          attempts: 0,
          best: 0,
        };
      }
      acc[quizId].attempts += 1;
      acc[quizId].best = Math.max(acc[quizId].best, attempt.percentage || 0);
      return acc;
    }, {});

    return Object.values(grouped).slice(0, 5);
  }, [attempts]);

  const subjectPerformance = progress?.subjectPerformance || [];
  const recentAttempts = attempts.slice(0, 10);
  const timelineAttempts = attempts.slice(0, 5);

  const quickWidgetsDynamic = [
    {
      title: 'Streak Pulse',
      text: `${progress?.streak || 0}-day active learning streak based on quiz activity.`,
      cta: 'View Insights',
      to: '/learning-insights',
    },
    {
      title: 'Reachout Priority',
      text: `${Math.max(0, 3 - (progress?.streak || 0))} follow-up goals suggested this week.`,
      cta: 'Open Reachouts',
      to: '/reachouts',
    },
    {
      title: 'Portfolio Snapshot',
      text: `Best score ${bestScore}% with ${attempts.length} total quiz attempts.`,
      cta: 'Open Portfolio',
      to: '/portfolio',
    },
  ];

  return (
    <div className="min-h-screen bg-[#ECE7D6] text-[#1A2E23]">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[210px_1fr]">
        <aside className="border-r border-[#D9D3BF] bg-[#E6EDE8] px-3 py-6 lg:min-h-screen">
          <div className="px-2">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-left"
            >
              <span className="text-3xl font-black tracking-tight text-[#246B43]">LearnLoop</span>
            </button>
            <p className="mt-6 px-1 text-[13px] font-medium text-[#5A6E62]">Subject Categories</p>
          </div>

          <nav className="mt-3 space-y-1">
            {sidebarLinks.map((item) => {
              const Icon = item.icon;
              const active = activePath === item.to;
              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.to)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                    active
                      ? 'bg-[#D4DECA] text-[#2B5B3E]'
                      : 'text-[#4B6557] hover:bg-[#DCE5DA]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl bg-[#D8E2D8] p-3">
            <div className="h-9 w-9 rounded-lg bg-[#7AB7D6]" />
            <p className="mt-3 text-[13px] leading-6 text-[#4F6A5B]">
              Track performance, marks, and learning reachouts from one portfolio view.
            </p>
            <button className="mt-3 w-full rounded-xl bg-[#E79A1A] py-2 text-[13px] font-semibold text-white">
              Upgrade now
            </button>
          </div>
        </aside>

        <main className="px-3 py-4 sm:px-4 lg:px-6">
          <header className="mb-4 flex items-center justify-between rounded-2xl bg-[#E6E0CE] px-4 py-3">
            <h1 className="rounded-xl bg-[#D4DECA] px-4 py-2 text-[13px] font-semibold text-[#2C5A40]">Dashboard</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/module3')}
                className="rounded-lg border border-[#A9C59F] bg-[#4A7A44]/70 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#3E6738]"
              >
                Peer to Peer Session
              </button>
              <button
                onClick={() => navigate('/module2')}
                className="rounded-lg bg-[#E79A1A] px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-[#CC8412]"
              >
                Quiz Builder
              </button>
              <Bell className="h-4 w-4 text-[#A37F36]" />
            </div>
          </header>

          {error && (
            <div className="mb-4 rounded-xl border border-[#E7B4B4] bg-[#FDEEEE] px-4 py-3 text-sm font-semibold text-[#8D3333]">
              {error}
            </div>
          )}

          <section className="grid gap-4 xl:grid-cols-[2fr_1.1fr]">
            <div className="rounded-2xl bg-gradient-to-r from-[#1D663E] to-[#2E5A29] p-4 text-white shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{studentName} - Student Dashboard</h2>
                  <p className="mt-1 max-w-2xl text-[13px] leading-6 text-[#DCEBDC]">
                    Track marks, reachouts, quiz performance, and lecture progression for this student.
                  </p>
                </div>
                <button onClick={() => navigate('/portfolio')} className="rounded-xl bg-[#E79A1A] px-4 py-2 text-[13px] font-semibold text-white">
                  Open Student Portfolio
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => navigate('/portfolio')} className="rounded-lg border border-[#A9C59F] bg-[#4A7A44]/70 px-3 py-1 text-[12px] font-semibold">
                  Student Portfolio
                </button>
                <button onClick={() => navigate('/learning-insights')} className="rounded-lg border border-[#A9C59F] bg-[#4A7A44]/70 px-3 py-1 text-[12px] font-semibold">
                  Learning Insights
                </button>
                <button onClick={() => navigate('/reachouts')} className="rounded-lg border border-[#A9C59F] bg-[#4A7A44]/70 px-3 py-1 text-[12px] font-semibold">
                  Reachouts Center
                </button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl bg-[#D7E4D4]/30 p-3">
                  <p className="text-2xl font-extrabold sm:text-[28px]">{averageScore}%</p>
                  <p className="text-[12px] text-[#DCEBDC]">MCQ Marks</p>
                </div>
                <div className="rounded-xl bg-[#D7E4D4]/30 p-3">
                  <p className="text-2xl font-extrabold sm:text-[28px]">{attendancePct}%</p>
                  <p className="text-[12px] text-[#DCEBDC]">Attendance</p>
                </div>
                <div className="rounded-xl bg-[#D7E4D4]/30 p-3">
                  <p className="text-2xl font-extrabold sm:text-[28px]">{attempts.length}</p>
                  <p className="text-[12px] text-[#DCEBDC]">Quiz Attempts</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F8F9F8] p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-2xl font-extrabold text-[#2E5D42]">
                  {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </h3>
                <CalendarDays className="h-5 w-5 text-[#8CA19A]" />
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#8FA0B8]">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
                  <p key={d}>{d}</p>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {calendarDays.map((day) => (
                  <button
                    key={day}
                    className={`rounded-lg py-1 text-[12px] font-medium ${
                      day === new Date().getDate()
                        ? 'border border-[#E79A1A] text-[#3C5E8A]'
                        : 'bg-[#EFF3FA] text-[#7690B2]'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[2fr_1.1fr]">
            <article className="rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-2xl font-extrabold text-[#225A3E]">My Activity</h3>
                <p className="text-[13px] font-medium text-[#8FA0B8]">This Week</p>
              </div>
              <div className="rounded-2xl bg-[#EEF2EA] px-4 pb-3 pt-5">
                <div className="relative h-28">
                  <svg viewBox="0 0 100 40" className="h-full w-full">
                    <polyline
                      fill="none"
                      stroke="#1E6A44"
                      strokeWidth="1.5"
                      points={activityLinePoints}
                    />
                  </svg>
                </div>
                <div className="mt-1 grid grid-cols-7 text-center text-[11px] text-[#8FA0B8]">
                  {activityLabels.map((day, idx) => (
                    <p key={day}>{day}</p>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-2xl font-extrabold text-[#225A3E]">My Courses</h3>
                <button className="text-[13px] font-medium text-[#8FA0B8]">See all</button>
              </div>
              {courses.length === 0 && subjectQuizAttempts.length === 0 ? (
                <p className="text-[13px] text-[#7A8C89]">No quiz attempts found for this student yet.</p>
              ) : (
                <div className="space-y-2">
                  {courses.map((course) => (
                    <div key={course.id} className="rounded-xl bg-[#EEF2EA] px-3 py-2">
                      <p className="text-[13px] font-semibold text-[#214A7A]">{course.title}</p>
                      <p className="text-[12px] text-[#6A7D79]">
                        {course.subject} | Attempts: {course.attempts} | Best: {course.best}%
                      </p>
                    </div>
                  ))}
                  {subjectQuizAttempts.slice(0, 3).map((attempt) => (
                    <div key={attempt.id} className="rounded-xl bg-[#E8F2E7] px-3 py-2 border border-[#D6E3D3]">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-[#214A7A]">{attempt.subjectTitle}</p>
                        <span className="rounded-full bg-[#DDE7C7] px-2 py-0.5 text-[11px] font-semibold text-[#2B5B3E]">Subject Quiz</span>
                      </div>
                      <p className="text-[12px] text-[#6A7D79]">
                        Marks: {attempt.score}/{attempt.totalQuestions} | Percentage: {attempt.percentage}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>

          <section className="mt-4 rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-[#225A3E]">Subject Marks</h3>
              <p className="text-[13px] text-[#8FA0B8]">Current Term</p>
            </div>
            {subjectPerformance.length === 0 ? (
              <div className="mt-2 flex items-end justify-between">
                <p className="text-[13px] text-[#7A8C89]">No subject marks yet</p>
                <p className="text-xl font-extrabold text-[#38608B] sm:text-2xl">0%</p>
              </div>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#DFE6DB] text-[#8FA0B8]">
                      <th className="py-2 font-medium">Subject</th>
                      <th className="py-2 font-medium">Attempts</th>
                      <th className="py-2 font-medium">Average</th>
                      <th className="py-2 font-medium">Highest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectPerformance.map((subject) => (
                      <tr key={subject.subject} className="border-b border-[#EFF3EE] text-[#5D6F6A]">
                        <td className="py-2">{subject.subject}</td>
                        <td className="py-2">{subject.attempts}</td>
                        <td className="py-2">{subject.averageScore}%</td>
                        <td className="py-2">{subject.highestScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 rounded-xl border border-[#D6DED3] bg-[#EEF2EA] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-[15px] font-semibold text-[#225A3A]">Subject Categories Quiz Marks</h4>
                  <p className="text-[12px] text-[#7A9080]">Subject name and marks from the most recent subject quiz.</p>
                </div>
                <p className="text-[12px] font-semibold text-[#214A7A]">{subjectQuizAttempts.length} submitted</p>
              </div>

              {subjectQuizAttempts.length === 0 ? (
                <p className="mt-3 text-[13px] text-[#7A9080]">No subject-category quiz attempts yet.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {subjectQuizAttempts.slice(0, 3).map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2">
                      <div>
                        <p className="text-[13px] font-semibold text-[#214A7A]">{attempt.subjectTitle}</p>
                        <p className="text-[12px] text-[#7A9080]">Completed {formatDateTime(attempt.completedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-semibold text-[#1A2E23]">{attempt.score}/{attempt.totalQuestions}</p>
                        <p className="text-[12px] text-[#7A9080]">{attempt.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="mt-4 rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-[#225A3E]">Trendy Learning Widgets</h3>
              <p className="text-[13px] text-[#8FA0B8]">Quick Panels</p>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {quickWidgetsDynamic.map((widget) => (
                <article key={widget.title} className="rounded-xl border border-[#D6DED3] bg-[#F3F7F0] p-3">
                  <h4 className="text-[15px] font-semibold text-[#214A7A]">{widget.title}</h4>
                  <p className="mt-2 text-[13px] text-[#7A8C89]">{widget.text}</p>
                  <button onClick={() => navigate(widget.to)} className="mt-3 w-full rounded-lg bg-[#E79A1A] py-2 text-[13px] font-semibold text-white">
                    {widget.cta}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-[#225A3E]">Enhance Your Learning</h3>
              <p className="text-[13px] text-[#8FA0B8]">New Features</p>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-5">
              {featureCards.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-xl border border-[#D6DED3] bg-[#F3F7F0] p-4 text-center">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#E9EFE3] text-[#225A3E]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="mt-3 text-[15px] font-semibold text-[#225A3E]">{item.title}</h4>
                    <p className="text-[12px] text-[#7A8C89]">{item.subtitle}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-4 rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-[#225A3E]">Study Timeline</h3>
              <button className="inline-flex items-center gap-1 text-[13px] font-medium text-[#8FA0B8]">
                View all
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#DFE6DB] text-[#8FA0B8]">
                    <th className="py-2 font-medium">Task</th>
                    <th className="py-2 font-medium">Subject</th>
                    <th className="py-2 font-medium">Due Date</th>
                    <th className="py-2 font-medium">Score</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {timelineAttempts.length === 0 ? (
                    <tr className="text-[#7A8C89]">
                      <td className="py-3" colSpan={5}>
                        No attempts yet for this student.
                      </td>
                    </tr>
                  ) : (
                    timelineAttempts.map((attempt) => (
                      <tr key={attempt._id} className="border-b border-[#EFF3EE] text-[#5D6F6A]">
                        <td className="py-2">{attempt.quiz?.title || 'Untitled Quiz'}</td>
                        <td className="py-2">{attempt.quiz?.subject || 'General'}</td>
                        <td className="py-2">{formatDateTime(attempt.completedAt)}</td>
                        <td className="py-2">{attempt.percentage}%</td>
                        <td className="py-2">{attempt.percentage >= 60 ? 'Passed' : 'Review Needed'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-4 rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-[#225A3E]">Quiz Attempts (MongoDB)</h3>
              <p className="text-[13px] font-medium text-[#8FA0B8]">Latest 10</p>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#DFE6DB] text-[#8FA0B8]">
                    <th className="py-2 font-medium">Attempt ID</th>
                    <th className="py-2 font-medium">Student</th>
                    <th className="py-2 font-medium">Quiz</th>
                    <th className="py-2 font-medium">Subject</th>
                    <th className="py-2 font-medium">Marks</th>
                    <th className="py-2 font-medium">Percentage</th>
                    <th className="py-2 font-medium">Time</th>
                    <th className="py-2 font-medium">Completed At</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttempts.length === 0 ? (
                    <tr className="text-[#7A8C89]">
                      <td className="py-3" colSpan={8}>
                        {loading ? 'Loading quiz attempts...' : 'No quiz attempts found in study-support-db.quizattempts.'}
                      </td>
                    </tr>
                  ) : (
                    recentAttempts.map((attempt) => (
                      <tr key={attempt._id} className="border-b border-[#EFF3EE] text-[#5D6F6A]">
                        <td className="py-2">{attempt._id?.slice(-8) || '-'}</td>
                        <td className="py-2">{studentName}</td>
                        <td className="py-2">{attempt.quiz?.title || 'Untitled Quiz'}</td>
                        <td className="py-2">{attempt.quiz?.subject || 'General'}</td>
                        <td className="py-2">
                          {attempt.score}/{attempt.totalQuestions}
                        </td>
                        <td className="py-2">{attempt.percentage}%</td>
                        <td className="py-2">{Math.round((attempt.timeTaken || 0) / 60)} min</td>
                        <td className="py-2">{formatDateTime(attempt.completedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
      <div style={{ position: 'relative', zIndex: 50, backgroundColor: '#173e1f' }}>
        <SiteFooter />
      </div>
    </div>
  );
};

export default Dashboard;
