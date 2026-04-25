import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import API from '../services/api';
import StudentSidebar from '../components/layout/StudentSidebar';
import SiteFooter from '../components/layout/SiteFooter';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
};

const buildLinePoints = (values) => {
  if (!values.length) return '0,30 100,30';
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 96;
      const y = 30 - ((value - min) / range) * 22;
      return `${x},${y}`;
    })
    .join(' ');
};

const Portfolio = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [peerBookings, setPeerBookings] = useState([]);
  const [peerSessions, setPeerSessions] = useState([]);
  const [interactiveQuizzes, setInteractiveQuizzes] = useState([]);
  const [mindMaps, setMindMaps] = useState([]);

  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
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

  useEffect(() => {
    const fetchPortfolio = async () => {
      setLoading(true);
      setError('');

      const [progressRes, attemptsRes, weeklyRes, bookingsRes, sessionsRes, quizzesRes, mindMapsRes] = await Promise.allSettled([
        API.get('/module2/progress'),
        API.get('/module2/attempts'),
        API.get('/module2/progress/weekly'),
        API.get('/module3/bookings'),
        API.get('/module3/sessions'),
        API.get('/module2/challenges'),
        API.get('/module2/generate/mindmaps'),
      ]);

      setProgress(progressRes.status === 'fulfilled' ? progressRes.value.data?.progress || null : null);
      setAttempts(attemptsRes.status === 'fulfilled' ? attemptsRes.value.data?.attempts || [] : []);
      setWeeklyProgress(weeklyRes.status === 'fulfilled' ? weeklyRes.value.data?.weeklyProgress || [] : []);
      setPeerBookings(bookingsRes.status === 'fulfilled' ? bookingsRes.value.data || [] : []);
      setPeerSessions(sessionsRes.status === 'fulfilled' ? sessionsRes.value.data || [] : []);
      setInteractiveQuizzes(
        quizzesRes.status === 'fulfilled' ? (Array.isArray(quizzesRes.value.data?.quizzes) ? quizzesRes.value.data.quizzes : []) : []
      );
      setMindMaps(mindMapsRes.status === 'fulfilled' ? (Array.isArray(mindMapsRes.value.data) ? mindMapsRes.value.data : []) : []);

      if (
        progressRes.status === 'rejected' &&
        attemptsRes.status === 'rejected' &&
        weeklyRes.status === 'rejected' &&
        bookingsRes.status === 'rejected' &&
        sessionsRes.status === 'rejected' &&
        quizzesRes.status === 'rejected' &&
        mindMapsRes.status === 'rejected'
      ) {
        setError('Unable to load portfolio data right now.');
      }

      setLoading(false);
    };

    fetchPortfolio();
  }, []);

  const studentName = user?.name || 'Student';
  const registrationNumber = user?.registrationNumber || 'N/A';
  const groupNumber = user?.groupNumber || 'N/A';
  const averageScore = progress?.averageScore ?? (attempts.length ? Math.round(attempts.reduce((sum, item) => sum + (item.percentage || 0), 0) / attempts.length) : 0);
  const bestScore = attempts.length ? Math.max(...attempts.map((item) => item.percentage || 0)) : 0;
  const passedAttempts = attempts.filter((item) => (item.percentage || 0) >= 60).length;
  const completionRate = attempts.length ? Math.round((passedAttempts / attempts.length) * 100) : 0;
  const activeDays = weeklyProgress.filter((day) => (day.attempts || 0) > 0).length;
  const attendanceRate = weeklyProgress.length ? Math.round((activeDays / weeklyProgress.length) * 100) : 0;
  const totalTimeMinutes = Math.round(attempts.reduce((sum, item) => sum + (item.timeTaken || 0), 0) / 60);
  const weeklyScores = useMemo(
    () => (weeklyProgress.length ? weeklyProgress.map((item) => item.averageScore || 0) : [0, 0, 0, 0, 0, 0, 0]),
    [weeklyProgress]
  );
  const weeklyLabels = useMemo(
    () =>
      weeklyProgress.length
        ? weeklyProgress.map((item) => {
            const date = new Date(item.date);
            return Number.isNaN(date.getTime()) ? 'Day' : date.toLocaleDateString(undefined, { weekday: 'short' });
          })
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    [weeklyProgress]
  );
  const linePoints = useMemo(() => buildLinePoints(weeklyScores), [weeklyScores]);
  const recentAttempts = attempts.slice(0, 4);
  const joinedSessionMap = useMemo(() => {
    const map = new Map();
    peerSessions.forEach((session) => {
      map.set(String(session._id), session);
    });
    return map;
  }, [peerSessions]);

  const joinedSessions = useMemo(() => {
    return peerBookings
      .map((booking) => ({
        ...booking,
        session: joinedSessionMap.get(String(booking.sessionId)),
      }))
      .filter((item) => item.session)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [peerBookings, joinedSessionMap]);

  const peerSessionAverage = joinedSessions.length
    ? Math.round(
        joinedSessions.reduce((sum, item) => sum + (item.session?.averageRating || 0), 0) / joinedSessions.length
      )
    : 0;
  const peerCoverage = peerSessions.length
    ? Math.round((joinedSessions.length / peerSessions.length) * 100)
    : 0;
  const latestSubjectAttempt = subjectQuizAttempts[0] || null;
  const weekAgo = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  }, []);

  const interactiveQuizThisWeek = useMemo(
    () => interactiveQuizzes.filter((item) => new Date(item.createdAt) >= weekAgo).length,
    [interactiveQuizzes, weekAgo]
  );

  const mindMapsThisWeek = useMemo(
    () => mindMaps.filter((item) => new Date(item.createdAt) >= weekAgo).length,
    [mindMaps, weekAgo]
  );

  const latestInteractiveQuiz = interactiveQuizzes[0] || null;
  const latestMindMap = mindMaps[0] || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECE7D6] text-[#1A2E23] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#D6ECD8] border-t-[#E8820C]" />
          <p className="text-[13px] font-medium text-[#5A6E62]">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECE7D6] text-[#1A2E23]">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[210px_1fr]">
        <StudentSidebar
          promoText="Track quiz marks, peer sessions, and study momentum in one refined portfolio view."
          promoButtonLabel="Open Dashboard"
          promoButtonTo="/dashboard"
        />

        <main className="px-3 py-4 sm:px-4 lg:px-6">
          <header className="mb-4 flex items-center justify-between rounded-2xl bg-[#E6E0CE] px-4 py-3">
            <h1 className="rounded-xl bg-[#D4DECA] px-4 py-2 text-[13px] font-semibold text-[#2C5A40]">Student Portfolio</h1>
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
              <button className="text-[#A37F36]" aria-label="Notifications">
                <CalendarDays className="h-4 w-4" />
              </button>
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
                  <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">Student Portfolio</h2>
                  <p className="mt-1 max-w-2xl text-[13px] leading-6 text-[#DCEBDC]">
                    A compact view of marks, learning activity, and peer collaboration for {studentName}.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate('/dashboard')} className="rounded-xl bg-[#E79A1A] px-4 py-2 text-[13px] font-semibold text-white">
                    Dashboard
                  </button>
                  <button onClick={() => navigate('/learning-insights')} className="rounded-xl border border-[#A9C59F] bg-[#4A7A44]/70 px-4 py-2 text-[13px] font-semibold text-white">
                    Learning Insights
                  </button>
                  <button onClick={() => navigate('/reachouts')} className="rounded-xl border border-[#A9C59F] bg-[#4A7A44]/70 px-4 py-2 text-[13px] font-semibold text-white">
                    Reachouts
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                <div className="rounded-xl bg-[#D7E4D4]/30 p-3">
                  <p className="text-2xl font-extrabold sm:text-[28px]">{averageScore}%</p>
                  <p className="text-[12px] text-[#DCEBDC]">Overall Marks</p>
                </div>
                <div className="rounded-xl bg-[#D7E4D4]/30 p-3">
                  <p className="text-2xl font-extrabold sm:text-[28px]">{averageScore}%</p>
                  <p className="text-[12px] text-[#DCEBDC]">Quiz Average</p>
                </div>
                <div className="rounded-xl bg-[#D7E4D4]/30 p-3">
                  <p className="text-2xl font-extrabold sm:text-[28px]">{joinedSessions.length}</p>
                  <p className="text-[12px] text-[#DCEBDC]">Reachouts</p>
                </div>
                <div className="rounded-xl bg-[#D7E4D4]/30 p-3">
                  <p className="text-2xl font-extrabold sm:text-[28px]">{completionRate}%</p>
                  <p className="text-[12px] text-[#DCEBDC]">Completion</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F8F9F8] p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-2xl font-extrabold text-[#2E5D42]">{new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3>
                <CalendarDays className="h-5 w-5 text-[#8CA19A]" />
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#8FA0B8]">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                  <p key={day}>{day}</p>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => (
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
                <h3 className="text-2xl font-extrabold text-[#225A3E]">Student Marks Chart</h3>
                <p className="text-[13px] font-medium text-[#8FA0B8]">Assessment Percentage</p>
              </div>
              <div className="rounded-2xl bg-[#EEF2EA] px-4 pb-3 pt-5">
                <div className="relative h-36">
                  <svg viewBox="0 0 100 40" className="h-full w-full">
                    <polyline fill="none" stroke="#1E6A44" strokeWidth="1.5" points={linePoints} />
                  </svg>
                </div>
                <div className="mt-1 grid grid-cols-7 text-center text-[11px] text-[#8FA0B8]">
                  {weeklyLabels.map((day) => (
                    <p key={day}>{day}</p>
                  ))}
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-2xl font-extrabold text-[#225A3E]">Student Details</h3>
                <button className="text-[13px] font-medium text-[#8FA0B8]">Profile</button>
              </div>
              <div className="rounded-xl bg-[#EEF2EA] p-4 space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A9080]">Student</p>
                  <p className="text-[15px] font-semibold text-[#214A7A]">{studentName}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-[11px] text-[#7A9080]">Registration</p>
                    <p className="text-[13px] font-semibold text-[#1A2E23]">{registrationNumber}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-[11px] text-[#7A9080]">Group</p>
                    <p className="text-[13px] font-semibold text-[#1A2E23]">{groupNumber}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-[11px] text-[#7A9080]">Attendance</p>
                    <p className="text-[13px] font-semibold text-[#1A2E23]">{attendanceRate}%</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3">
                    <p className="text-[11px] text-[#7A9080]">Last Activity</p>
                    <p className="text-[13px] font-semibold text-[#1A2E23]">{formatDateTime(attempts[0]?.completedAt)}</p>
                  </div>
                </div>
              </div>
            </article>
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-2">
            <article className="rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-2xl font-extrabold text-[#225A3E]">Quiz Marks</h3>
                <p className="text-[13px] font-medium text-[#8FA0B8]">Quiz Performance</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-[#EEF2EA] px-4 py-3">
                  <p className="text-[13px] text-[#7A9080]">Average score</p>
                  <p className="text-[13px] font-semibold text-[#214A7A]">{averageScore}%</p>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#EEF2EA] px-4 py-3">
                  <p className="text-[13px] text-[#7A9080]">Best score</p>
                  <p className="text-[13px] font-semibold text-[#214A7A]">{bestScore}%</p>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-[#EEF2EA] px-4 py-3">
                  <p className="text-[13px] text-[#7A9080]">Attempts</p>
                  <p className="text-[13px] font-semibold text-[#214A7A]">{attempts.length}</p>
                </div>
                <div className="rounded-xl bg-white/70 p-3">
                  {recentAttempts.length === 0 ? (
                    <p className="text-[13px] text-[#7A9080]">No attempts yet</p>
                  ) : (
                    recentAttempts.map((attempt) => (
                      <div key={attempt._id} className="flex items-center justify-between border-b border-[#E6E0CE] py-2 last:border-b-0">
                        <div>
                          <p className="text-[13px] font-semibold text-[#1A2E23]">{attempt.quiz?.title || 'Untitled Quiz'}</p>
                          <p className="text-[12px] text-[#7A9080]">{formatDate(attempt.completedAt)}</p>
                        </div>
                        <p className="text-[13px] font-semibold text-[#214A7A]">{attempt.percentage}%</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </article>

            <article className="rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-2xl font-extrabold text-[#225A3E]">Mapping Referring (%)</h3>
                <p className="text-[13px] font-medium text-[#8FA0B8]">Knowledge Mapping</p>
              </div>
              <div className="rounded-xl bg-[#EEF2EA] px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-[#7A9080]">Mapped learning activity</p>
                  <p className="text-[13px] font-semibold text-[#214A7A]">{peerCoverage}%</p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#E3EBD9]">
                  <div className="h-2 rounded-full bg-[#1E6A44]" style={{ width: `${Math.min(peerCoverage, 100)}%` }} />
                </div>
                <p className="mt-2 text-[13px] text-[#7A9080]">
                  Derived from your peer session coverage across available sessions.
                </p>
              </div>
            </article>
          </section>

          <section className="mt-4 rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-[#225A3E]">Subject Categories Quiz Marks</h3>
              <p className="text-[13px] font-medium text-[#8FA0B8]">Latest submitted subject quiz</p>
            </div>
            {subjectQuizAttempts.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-[#D6DED3] bg-white/70 px-4 py-5">
                <p className="text-[13px] text-[#7A9080]">No subject-category quiz attempts yet. Submit a subject quiz to see the subject name and marks here.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {subjectQuizAttempts.slice(0, 3).map((attempt) => (
                  <div key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#EEF2EA] px-4 py-3">
                    <div>
                      <p className="text-[13px] font-semibold text-[#214A7A]">{attempt.subjectTitle}</p>
                      <p className="text-[12px] text-[#7A9080]">Completed: {formatDateTime(attempt.completedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold text-[#1A2E23]">{attempt.score}/{attempt.totalQuestions}</p>
                      <p className="text-[12px] text-[#7A9080]">{attempt.percentage}%</p>
                    </div>
                  </div>
                ))}
                {latestSubjectAttempt && (
                  <div className="rounded-xl border border-[#D6DED3] bg-white/70 px-4 py-3 text-[13px] text-[#7A9080]">
                    Latest submission: <span className="font-semibold text-[#214A7A]">{latestSubjectAttempt.subjectTitle}</span> with <span className="font-semibold text-[#214A7A]">{latestSubjectAttempt.score}/10</span>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="mt-4 rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-[#225A3E]">Study Tracker</h3>
              <p className="text-[13px] font-medium text-[#8FA0B8]">Current Week</p>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <article className="rounded-xl border border-[#D6DED3] bg-[#F3F7F0] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#225A3E]">Interactive Quizzes</p>
                    <p className="text-[13px] text-[#7A9080]">Generated in Module 2 and ready for attempts.</p>
                  </div>
                  <div className="rounded-full bg-[#DDE7C7] px-3 py-1 text-[12px] font-semibold text-[#2B5B3E]">
                    {interactiveQuizzes.length} total
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                  <p className="text-[13px] text-[#7A9080]">Created this week</p>
                  <p className="text-[13px] font-semibold text-[#214A7A]">{interactiveQuizThisWeek}</p>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                  <p className="text-[13px] text-[#7A9080]">Latest quiz</p>
                  <p className="text-[13px] font-semibold text-[#214A7A]">{latestInteractiveQuiz?.title || 'No quizzes yet'}</p>
                </div>
                <button
                  onClick={() => navigate('/module2')}
                  className="mt-3 w-full rounded-lg bg-[#E79A1A] py-2 text-[13px] font-semibold text-white"
                >
                  Open Interactive Quiz Tracker
                </button>
              </article>

              <article className="rounded-xl border border-[#D6DED3] bg-[#F3F7F0] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[#225A3E]">Mind Maps</p>
                    <p className="text-[13px] text-[#7A9080]">Visual concept maps generated from Module 2 content.</p>
                  </div>
                  <div className="rounded-full bg-[#DDE7C7] px-3 py-1 text-[12px] font-semibold text-[#2B5B3E]">
                    {mindMaps.length} total
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                  <p className="text-[13px] text-[#7A9080]">Created this week</p>
                  <p className="text-[13px] font-semibold text-[#214A7A]">{mindMapsThisWeek}</p>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-lg bg-white/70 px-3 py-2">
                  <p className="text-[13px] text-[#7A9080]">Latest mind map</p>
                  <p className="text-[13px] font-semibold text-[#214A7A]">{latestMindMap?.title || 'No mind maps yet'}</p>
                </div>
                <button
                  onClick={() => navigate('/module2')}
                  className="mt-3 w-full rounded-lg bg-[#1E6A44] py-2 text-[13px] font-semibold text-white"
                >
                  Open Mind Map Tracker
                </button>
              </article>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-[#D6DED3] bg-[#EEF2EA] px-4 py-3">
              <p className="text-[13px] text-[#7A9080]">Total study time</p>
              <p className="text-[13px] font-semibold text-[#214A7A]">{totalTimeMinutes} mins</p>
            </div>
          </section>

          <section className="mt-4 rounded-2xl bg-[#F9F9F9] p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-extrabold text-[#225A3E]">Peer Sessions Progress</h3>
              <p className="text-[13px] font-medium text-[#8FA0B8]">Student Collaboration</p>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              {joinedSessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D6DED3] bg-white/70 p-4 lg:col-span-3">
                  <p className="text-[13px] text-[#7A9080]">No peer sessions yet.</p>
                </div>
              ) : (
                joinedSessions.slice(0, 3).map((booking) => (
                  <article key={booking._id} className="rounded-xl border border-[#D6DED3] bg-[#F3F7F0] p-4">
                    <h4 className="text-[15px] font-semibold text-[#214A7A]">{booking.session?.title}</h4>
                    <p className="mt-1 text-[12px] text-[#7A9080]">{booking.session?.moduleCode} {booking.session?.moduleName ? `- ${booking.session.moduleName}` : ''}</p>
                    <p className="mt-2 text-[12px] text-[#7A9080]">Joined: {formatDateTime(booking.createdAt)}</p>
                    <p className="mt-1 text-[12px] text-[#7A9080]">Rating: {booking.session?.averageRating || 0}/5</p>
                    <button
                      onClick={() => navigate(`/module3/session/${booking.session._id}`)}
                      className="mt-3 w-full rounded-lg bg-[#E79A1A] py-2 text-[13px] font-semibold text-white"
                    >
                      Open Session
                    </button>
                  </article>
                ))
              )}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#EEF2EA] px-4 py-3">
              <p className="text-[13px] text-[#7A9080]">Average peer session rating</p>
              <p className="text-[13px] font-semibold text-[#214A7A]">{peerSessionAverage}/5</p>
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

export default Portfolio;
