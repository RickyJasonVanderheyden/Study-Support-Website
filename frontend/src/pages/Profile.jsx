import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, BookOpen, CalendarDays, Users, Target, Flame, TrendingUp, FileText, Camera, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import SiteHeader from '../components/layout/SiteHeader';
import SiteFooter from '../components/layout/SiteFooter';
import Card from '../components/common/Card';

const emptyStats = {
  totalQuizzes: 0,
  totalAttempts: 0,
  averageScore: 0,
  streak: 0,
  totalFlashcardSets: 0,
  totalMindMaps: 0,
  totalAudioNotes: 0,
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', mobileNumber: '', groupNumber: '' });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const hasLoadedRef = useRef(false);

  const imageBaseUrl = useMemo(() => {
    const base = api.defaults.baseURL || 'http://localhost:5000/api';
    return base.replace(/\/api\/?$/, '');
  }, []);

  const profileImageSrc = useMemo(() => {
    if (!user?.profileImageUrl) return null;
    if (/^https?:\/\//i.test(user.profileImageUrl)) return user.profileImageUrl;
    return `${imageBaseUrl}${user.profileImageUrl}`;
  }, [user, imageBaseUrl]);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    const loadProfileAndStats = async () => {
      try {
        const [profileResponse, progressResponse] = await Promise.allSettled([
          api.get('/auth/me'),
          api.get('/module2/progress'),
        ]);

        if (profileResponse.status !== 'fulfilled') {
          const status = profileResponse.reason?.response?.status;
          if (status === 401) {
            toast.error('Please log in again');
            navigate('/login');
            return;
          }
          const profileError =
            profileResponse.reason?.response?.data?.error ||
            profileResponse.reason?.message ||
            'Unable to load profile details';
          toast.error(profileError);
          return;
        }

        const profile = profileResponse.value?.data?.user || null;
        const progress =
          progressResponse.status === 'fulfilled'
            ? (progressResponse.value?.data?.progress || {})
            : {};

        setUser(profile);
        setProfileForm({
          name: profile?.name || '',
          mobileNumber: profile?.mobileNumber || '',
          groupNumber: profile?.groupNumber || '',
        });

        if (profile) {
          localStorage.setItem('user', JSON.stringify(profile));
        }

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

        if (progressResponse.status !== 'fulfilled') {
          const statsError =
            progressResponse.reason?.response?.data?.error ||
            progressResponse.reason?.message ||
            'Unable to load activity stats';
          toast.error(statsError);
        }
      } catch (error) {
        console.error('Profile load error:', error);
        if (error?.response?.status === 401) {
          toast.error('Please log in again');
          navigate('/login');
          return;
        }
        const errorMsg = error?.response?.data?.error || error?.message || 'Unable to load profile details';
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    loadProfileAndStats();
  }, [navigate]);

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', profileForm.name.trim());
      formData.append('mobileNumber', profileForm.mobileNumber.trim());
      formData.append('groupNumber', profileForm.groupNumber.trim());
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }

      const response = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUser = response.data?.user;
      setUser(updatedUser);
      setProfileImageFile(null);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error?.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const onImagePicked = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2 MB');
      return;
    }
    setProfileImageFile(file);
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

  const profileSections = [
    {
      title: 'Account Information',
      icon: ShieldCheck,
      items: [
        { label: 'Full name', value: user.name || 'Student' },
        { label: 'Email', value: user.email || 'N/A' },
        { label: 'Registration number', value: user.registrationNumber || 'N/A' },
        { label: 'Role', value: user.role || 'student' },
      ],
    },
    {
      title: 'Academic Details',
      icon: BookOpen,
      items: [
        { label: 'Group number', value: user.groupNumber || 'Not assigned' },
        { label: 'Joined', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
        { label: 'Study mode', value: 'AI Tools + Peer Learning' },
        { label: 'Status', value: 'Active learner' },
      ],
    },
    {
      title: 'Learning Activity',
      icon: TrendingUp,
      items: [
        { label: 'Quizzes created', value: stats.totalQuizzes },
        { label: 'Attempts', value: stats.totalAttempts },
        { label: 'Average score', value: `${stats.averageScore}%` },
        { label: 'Current streak', value: `${stats.streak} days` },
      ],
    },
  ];

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
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-[#D8E8DC] bg-[#FFFDF8] shadow-2xl shadow-[rgba(30,77,53,0.08)]">
            <div className="grid gap-8 bg-gradient-to-r from-[#173e1f] via-[#1E4D35] to-[#2E5C42] px-6 py-10 text-white md:grid-cols-[1.4fr_1fr] md:px-10">
              <div className="space-y-5">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.28em] text-[#D6ECD8]">
                  Student profile
                </p>
                <h1 className="max-w-2xl text-4xl font-black tracking-tight md:text-5xl">
                  Welcome back, {user.name || 'Student'}.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[#EAF4ED] md:text-lg">
                  Your personal study space keeps AI tools, peer collaboration, dashboard insights, and your learning profile together in one calm workspace.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => navigate('/module2')} className="rounded-full bg-[#E8820C] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#C96800]">
                    Open AI Tools
                  </button>
                  <button onClick={() => navigate('/module3')} className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                    Peer Sessions
                  </button>
                  <button onClick={handleLogout} className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                    Logout
                  </button>
                </div>
              </div>

              <Card className="border border-white/10 bg-white/10 p-0 text-white shadow-none backdrop-blur-md">
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    {profileImageSrc ? (
                      <img
                        src={profileImageSrc}
                        alt="Student profile"
                        className="h-16 w-16 rounded-2xl object-cover bg-white shadow-lg"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#1E4D35] shadow-lg">
                        <BadgeCheck className="h-8 w-8" />
                      </div>
                    )}
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
                      <p className="text-xs uppercase tracking-[0.24em] text-[#D6ECD8]">Group</p>
                      <p className="mt-1 font-semibold">{user.groupNumber || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <Card title="Edit Student Profile" className="border border-[#D8E8DC] bg-white shadow-sm">
            <form onSubmit={handleProfileSave} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#3D5246]">Full Name</label>
                <input
                  className="w-full rounded-lg border border-[#D8E8DC] bg-[#FFFDF8] px-3 py-2 text-sm"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#3D5246]">Mobile Number</label>
                <input
                  className="w-full rounded-lg border border-[#D8E8DC] bg-[#FFFDF8] px-3 py-2 text-sm"
                  value={profileForm.mobileNumber}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                  placeholder="+94712345678"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#3D5246]">Group Number</label>
                <input
                  className="w-full rounded-lg border border-[#D8E8DC] bg-[#FFFDF8] px-3 py-2 text-sm"
                  value={profileForm.groupNumber}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, groupNumber: e.target.value }))}
                  placeholder="e.g. Y1S2-G4"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#3D5246]">Registration Number</label>
                <input
                  className="w-full rounded-lg border border-[#D8E8DC] bg-[#F7F4EE] px-3 py-2 text-sm text-[#7A9080]"
                  value={user.registrationNumber || ''}
                  readOnly
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-[#3D5246]">Profile Image</label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#D8E8DC] bg-[#FFFDF8] px-4 py-2 text-sm font-semibold text-[#1E4D35]">
                  <Camera className="h-4 w-4" />
                  Choose Image
                  <input type="file" accept="image/*" className="hidden" onChange={onImagePicked} />
                </label>
                {profileImageFile && <p className="text-xs text-[#7A9080]">Selected: {profileImageFile.name}</p>}
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1E4D35] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#2E5C42] disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statsCards.map((item) => {
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

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {profileSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.title} title={section.title} icon={<Icon className="h-5 w-5" />} className="border border-[#D8E8DC] bg-white shadow-sm">
                  <div className="space-y-4">
                    {section.items.map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4 border-b border-[#E8DECE] pb-3 last:border-b-0 last:pb-0">
                        <span className="text-sm font-medium text-[#7A9080]">{item.label}</span>
                        <span className="text-right text-sm font-semibold text-[#1A2E23]">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Profile;
