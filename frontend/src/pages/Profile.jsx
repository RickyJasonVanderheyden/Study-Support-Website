import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck, BookOpen, CalendarDays, Mail, ShieldCheck, Users, Target, Flame,
  TrendingUp, FileText, Pencil, X, Plus, Save, Sparkles, Code, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

import SiteFooter from '../components/layout/SiteFooter';
import Card from '../components/common/Card';

const POPULAR_SKILLS = [
  'React', 'Node.js', 'Python', 'Java', 'JavaScript', 'TypeScript',
  'MongoDB', 'MySQL', 'Express', 'Angular', 'Vue.js', 'Flutter',
  'Swift', 'Kotlin', 'PHP', 'Laravel', 'Spring Boot', 'Django',
  'AWS', 'Docker', 'Git', 'CSS', 'HTML', 'Tailwind',
  'Figma', 'UI/UX', 'Machine Learning', 'Deep Learning',
  'C++', 'C#', 'Rust', 'Go', 'Ruby', '.NET',
  'Firebase', 'GraphQL', 'REST API', 'Next.js',
  'Android', 'iOS', 'DevOps', 'Agile', 'Scrum'
];

const emptyStats = {
  totalQuizzes: 0, totalAttempts: 0, averageScore: 0, streak: 0,
  totalFlashcardSets: 0, totalMindMaps: 0, totalAudioNotes: 0,
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editingBio, setEditingBio] = useState(false);
  const [editingSkills, setEditingSkills] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [skillsInput, setSkillsInput] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rawUser = localStorage.getItem('user');
    if (!token || !rawUser) { navigate('/login'); return; }

    // Fetch fresh profile from server
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        const freshUser = res.data.user;
        setUser(freshUser);
        setBioInput(freshUser.bio || '');
        setNameInput(freshUser.name || '');
        setSkillsInput(freshUser.skills || []);
        // Sync localStorage
        const localUser = JSON.parse(localStorage.getItem('user')) || {};
        localStorage.setItem('user', JSON.stringify({ ...localUser, ...freshUser, id: freshUser._id }));
      } catch {
        const parsed = JSON.parse(rawUser);
        setUser(parsed);
        setBioInput(parsed.bio || '');
        setNameInput(parsed.name || '');
        setSkillsInput(parsed.skills || []);
      }
    };

    const loadStats = async () => {
      try {
        const response = await api.get('/module2/progress');
        const progress = response.data?.progress || {};
        setStats({
          ...emptyStats,
          totalQuizzes: progress.totalQuizzes || 0,
          totalAttempts: progress.totalAttempts || 0,
          averageScore: progress.averageScore || 0,
          streak: progress.streak || 0,
          totalFlashcardSets: progress.totalFlashcardSets || 0,
          totalMindMaps: progress.totalMindMaps || 0,
          totalAudioNotes: progress.totalAudioNotes || 0,
        });
      } catch (error) {
        if (error?.response?.status === 401) { navigate('/login'); return; }
      }
    };

    Promise.all([loadProfile(), loadStats()]).finally(() => setLoading(false));
  }, [navigate]);

  const handleSaveProfile = async (field) => {
    setSaving(true);
    try {
      const payload = {};
      if (field === 'bio') payload.bio = bioInput;
      if (field === 'name') payload.name = nameInput;
      if (field === 'skills') payload.skills = skillsInput;

      const res = await api.put('/auth/profile', payload);
      const updated = res.data.user;
      setUser(updated);

      // Sync localStorage
      const localUser = JSON.parse(localStorage.getItem('user')) || {};
      localStorage.setItem('user', JSON.stringify({ ...localUser, ...updated, id: updated._id }));
      window.dispatchEvent(new Event('storage'));

      toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated!`);
      if (field === 'bio') setEditingBio(false);
      if (field === 'name') setEditingName(false);
      if (field === 'skills') setEditingSkills(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = (skill) => {
    const trimmed = skill.trim();
    if (!trimmed || skillsInput.includes(trimmed) || skillsInput.length >= 20) return;
    setSkillsInput([...skillsInput, trimmed]);
    setNewSkill('');
  };

  const removeSkill = (skill) => {
    setSkillsInput(skillsInput.filter(s => s !== skill));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('module2_storageUserId');
    navigate('/login');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#D6ECD8] border-t-[#E8820C]" />
      </div>
    );
  }

  const placementString = user.year && user.semester
    ? `${user.year} · ${user.semester} · MG${String(user.mainGroup || '?').toString().padStart(2, '0')} · SG${user.subGroup || '?'}`
    : 'Not assigned';

  const statsCards = [
    { label: 'Quiz sets', value: stats.totalQuizzes, icon: FileText, tone: 'from-blue-500 to-cyan-500' },
    { label: 'Flashcards', value: stats.totalFlashcardSets, icon: BookOpen, tone: 'from-amber-500 to-orange-500' },
    { label: 'Mind maps', value: stats.totalMindMaps, icon: Target, tone: 'from-purple-500 to-violet-500' },
    { label: 'Audio notes', value: stats.totalAudioNotes, icon: Users, tone: 'from-emerald-500 to-green-500' },
    { label: 'Avg score', value: `${stats.averageScore}%`, icon: Flame, tone: 'from-[#E8820C] to-[#C96800]' },
    { label: 'Streak', value: `${stats.streak}d`, icon: CalendarDays, tone: 'from-[#1E4D35] to-[#2E5C42]' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] flex flex-col">

      <main className="flex-1">

        {/* Hero Banner */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-[#D8E8DC] bg-[#FFFDF8] shadow-2xl shadow-[rgba(30,77,53,0.08)]">
            <div className="grid gap-8 bg-gradient-to-r from-[#173e1f] via-[#1E4D35] to-[#2E5C42] px-6 py-10 text-white md:grid-cols-[1.4fr_1fr] md:px-10">
              <div className="space-y-5">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.28em] text-[#D6ECD8]">
                  {(user.role === 'admin' || user.role === 'super_admin') ? '🛡️ Admin' : user.role === 'instructor' ? '🎓 Instructor' : '📚 Student'} profile
                </p>

                {/* Editable Name */}
                {editingName ? (
                  <div className="flex items-center gap-3">
                    <input
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      className="bg-white/10 border border-white/30 rounded-xl px-4 py-2 text-2xl font-black text-white outline-none focus:ring-2 focus:ring-white/50 w-full max-w-md"
                      autoFocus
                    />
                    <button onClick={() => handleSaveProfile('name')} disabled={saving}
                      className="p-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors">
                      <Save size={18} />
                    </button>
                    <button onClick={() => { setEditingName(false); setNameInput(user.name || ''); }}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h1 className="max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
                      {user.name || 'Student'}
                    </h1>
                    <button onClick={() => setEditingName(true)}
                      className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors opacity-60 hover:opacity-100">
                      <Pencil size={16} />
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-sm text-[#D6ECD8]">
                  <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><BadgeCheck size={14} /> {user.registrationNumber || 'N/A'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><BookOpen size={14} /> {placementString}</span>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => navigate('/')} className="rounded-full bg-[#E8820C] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#C96800]">
                    Go to Dashboard
                  </button>
                  <button onClick={() => navigate('/module4')} className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                    Member Finder
                  </button>
                  <button onClick={handleLogout} className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                    Logout
                  </button>
                </div>
              </div>

              {/* Profile Card */}
              <Card className="border border-white/10 bg-white/10 p-0 text-white shadow-none backdrop-blur-md">
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#1E4D35] shadow-lg text-2xl font-black">
                      {user.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D6ECD8]">Profile status</p>
                      <h2 className="text-2xl font-black">Active learner</h2>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3 text-sm text-[#F7F4EE]">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#D6ECD8]">Registration</p>
                      <p className="mt-1 font-semibold">{user.registrationNumber || 'N/A'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#D6ECD8]">Academic Placement</p>
                      <p className="mt-1 font-semibold">{placementString}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statsCards.map(item => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="border border-[#D8E8DC] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#7A9080]">{item.label}</p>
                      <p className="mt-2 text-3xl font-black text-[#1A2E23]">{item.value}</p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-r ${item.tone} text-white shadow-lg`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Editable Sections */}
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">

            {/* ── Bio Section ── */}
            <div className="bg-white rounded-2xl border border-[#D8E8DC] shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                    <Heart size={16} />
                  </div>
                  <h3 className="font-bold text-[#1A2E23]">About Me</h3>
                </div>
                {!editingBio && (
                  <button onClick={() => setEditingBio(true)}
                    className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:text-indigo-800 transition-colors">
                    <Pencil size={12} /> Edit
                  </button>
                )}
              </div>

              {editingBio ? (
                <div className="space-y-3">
                  <textarea
                    value={bioInput}
                    onChange={e => setBioInput(e.target.value)}
                    maxLength={300}
                    placeholder="Tell others about yourself, your interests, and what excites you..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-28 bg-gray-50"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{bioInput.length}/300</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingBio(false); setBioInput(user.bio || ''); }}
                        className="px-4 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        Cancel
                      </button>
                      <button onClick={() => handleSaveProfile('bio')} disabled={saving}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1">
                        <Save size={12} /> {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {user.bio || <span className="text-gray-400 italic">No bio yet — click Edit to add one!</span>}
                </p>
              )}
            </div>

            {/* ── Skills Section ── */}
            <div className="bg-white rounded-2xl border border-[#D8E8DC] shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                    <Code size={16} />
                  </div>
                  <h3 className="font-bold text-[#1A2E23]">Skills & Technologies</h3>
                </div>
                {!editingSkills && (
                  <button onClick={() => setEditingSkills(true)}
                    className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:text-emerald-800 transition-colors">
                    <Pencil size={12} /> Edit
                  </button>
                )}
              </div>

              {editingSkills ? (
                <div className="space-y-4">
                  {/* Current skills with remove */}
                  <div className="flex flex-wrap gap-2">
                    {skillsInput.map(skill => (
                      <span key={skill}
                        className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
                        {skill}
                        <button onClick={() => removeSkill(skill)} className="hover:text-red-600 transition-colors">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {skillsInput.length === 0 && (
                      <span className="text-xs text-gray-400 italic">No skills added yet</span>
                    )}
                  </div>

                  {/* Add new skill */}
                  <div className="flex gap-2">
                    <input
                      value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkill); } }}
                      placeholder="Type a skill and press Enter..."
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50"
                    />
                    <button onClick={() => addSkill(newSkill)}
                      className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Popular skills suggestions */}
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles size={12} /> Popular skills — click to add
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SKILLS.filter(s => !skillsInput.includes(s)).slice(0, 18).map(skill => (
                        <button key={skill} onClick={() => addSkill(skill)}
                          className="text-[11px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-emerald-100 hover:text-emerald-700 transition-colors">
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => { setEditingSkills(false); setSkillsInput(user.skills || []); }}
                      className="px-4 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                    <button onClick={() => handleSaveProfile('skills')} disabled={saving}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1">
                      <Save size={12} /> {saving ? 'Saving...' : 'Save Skills'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(user.skills && user.skills.length > 0) ? user.skills.map(skill => (
                    <span key={skill}
                      className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-semibold border border-emerald-200">
                      {skill}
                    </span>
                  )) : (
                    <span className="text-sm text-gray-400 italic">No skills added yet — click Edit to showcase your expertise!</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Account Info Section */}
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Account Information" icon={<ShieldCheck className="h-5 w-5" />} className="border border-[#D8E8DC] bg-white shadow-sm">
              <div className="space-y-4">
                {[
                  { label: 'Full name', value: user.name || 'Student' },
                  { label: 'Email', value: user.email || 'N/A' },
                  { label: 'Registration', value: user.registrationNumber || 'N/A' },
                  { label: 'Role', value: user.role || 'student' },
                ].map(item => (
                  <div key={item.label} className="flex items-start justify-between gap-4 border-b border-[#E8DECE] pb-3 last:border-b-0 last:pb-0">
                    <span className="text-sm font-medium text-[#7A9080]">{item.label}</span>
                    <span className="text-right text-sm font-semibold text-[#1A2E23]">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Academic Details" icon={<BookOpen className="h-5 w-5" />} className="border border-[#D8E8DC] bg-white shadow-sm">
              <div className="space-y-4">
                {[
                  { label: 'Year', value: user.year || 'Not set' },
                  { label: 'Semester', value: user.semester || 'Not set' },
                  { label: 'Main Group', value: user.mainGroup ? `MG${String(user.mainGroup).padStart(2, '0')}` : 'Not set' },
                  { label: 'Sub Group', value: user.subGroup ? `SG${user.subGroup}` : 'Not set' },
                ].map(item => (
                  <div key={item.label} className="flex items-start justify-between gap-4 border-b border-[#E8DECE] pb-3 last:border-b-0 last:pb-0">
                    <span className="text-sm font-medium text-[#7A9080]">{item.label}</span>
                    <span className="text-right text-sm font-semibold text-[#1A2E23]">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Learning Activity" icon={<TrendingUp className="h-5 w-5" />} className="border border-[#D8E8DC] bg-white shadow-sm">
              <div className="space-y-4">
                {[
                  { label: 'Quizzes created', value: stats.totalQuizzes },
                  { label: 'Attempts', value: stats.totalAttempts },
                  { label: 'Average score', value: `${stats.averageScore}%` },
                  { label: 'Current streak', value: `${stats.streak} days` },
                ].map(item => (
                  <div key={item.label} className="flex items-start justify-between gap-4 border-b border-[#E8DECE] pb-3 last:border-b-0 last:pb-0">
                    <span className="text-sm font-medium text-[#7A9080]">{item.label}</span>
                    <span className="text-right text-sm font-semibold text-[#1A2E23]">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Profile;
