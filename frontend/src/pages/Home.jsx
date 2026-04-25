import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Users, Search, Bell,
  ChevronRight, TrendingUp, UserCheck, Sparkles
} from 'lucide-react';
import { getMyGroups, getReceivedInvitations } from '../services/module4Api';

import SiteFooter from '../components/layout/SiteFooter';

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [groups, setGroups] = useState([]);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
            fetchDashboardData();
        } else {
            const timer = setTimeout(() => {
                navigate('/login');
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            const [groupsRes, invRes] = await Promise.all([
                getMyGroups().catch(() => ({ data: { groups: [] } })),
                getReceivedInvitations().catch(() => ({ data: { invitations: [] } }))
            ]);
            setGroups(groupsRes.data.groups || []);
            setInvitations(invRes.data.invitations || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Splash Screen / Loading State using LearnLoop Branding
    if (!user || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#EAF4ED] via-[#F7F4EE] to-[#FDFCF9] flex flex-col items-center justify-center p-4 overflow-hidden">
                <div className="text-center flex flex-col items-center justify-center space-y-6">
                    <h1 className="text-6xl md:text-8xl font-extrabold bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B] bg-clip-text text-transparent animate-pulse tracking-tight drop-shadow-sm">
                        LearnLoop
                    </h1>
                    <p className="text-xl md:text-2xl text-[#276332] font-semibold tracking-wide animate-pulse opacity-80">
                        {user ? 'Preparing your dashboard...' : 'Entering study portal...'}
                    </p>
                    <div className="w-12 h-12 border-4 border-emerald-100 border-t-[#F59E0B] rounded-full animate-spin mt-8 mx-auto shadow-sm"></div>
                </div>
            </div>
        );
    }

    const activeGroups = groups.filter(g => g.status === 'active').length;
    const totalMembers = groups.reduce((sum, g) => sum + (g.members?.length || 0), 0);

    const statCards = [
        { label: 'My Groups', value: groups.length, icon: <Users size={22} />, color: 'from-[#276332] to-[#556B2F]', change: `${activeGroups} active` },
        { label: 'Total Members', value: totalMembers, icon: <UserCheck size={22} />, color: 'from-emerald-500 to-emerald-700', change: 'Across all groups' },
        { label: 'Pending Invitations', value: invitations.length, icon: <Bell size={22} />, color: 'from-[#F59E0B] to-[#D97706]', change: invitations.length > 0 ? 'Action needed' : 'All caught up' },
        { label: 'Platform Status', value: 'Live', icon: <Sparkles size={22} />, color: 'from-purple-500 to-purple-700', change: 'All systems go' },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#EAF4ED] via-[#F7F4EE] to-[#FDFCF9]">

            <main className="flex-1">
                <div className="p-8 space-y-8 max-w-7xl mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-[2rem] border border-emerald-50 shadow-sm shadow-emerald-900/5">
                        <div className="text-left">
                            <h2 className="text-3xl font-black text-[#276332] tracking-tight">Welcome back, {user.name}! 👋</h2>
                            <p className="text-slate-500 font-medium mt-1">Here is what is happening in your study community today.</p>
                        </div>
                        <Link to="/module3" className="px-6 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-xl shadow-lg shadow-amber-900/10 transition-all flex items-center gap-2 w-fit">
                            Join a Session <ChevronRight size={18} />
                        </Link>
                    </div>

                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {statCards.map((card, i) => (
                            <div key={i} className="bg-white rounded-[2rem] border border-emerald-50 p-6 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                                <div className="flex items-center justify-between mb-4 relative z-10 text-left">
                                    <span className="text-xs uppercase tracking-widest font-black text-slate-400">{card.label}</span>
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-xl group-hover:-translate-y-1 transition-transform`}>
                                        {card.icon}
                                    </div>
                                </div>
                                <p className="text-4xl font-black text-[#276332] relative z-10 tracking-tight text-left">{card.value}</p>
                                <p className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 uppercase tracking-wide text-left">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                                    {card.change}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Modules Grid */}
                            <div className="bg-white rounded-[2.5rem] border border-emerald-50 overflow-hidden shadow-sm shadow-emerald-900/5">
                                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-emerald-50/30">
                                    <h3 className="font-black text-[#276332] uppercase tracking-widest text-xs">Learning Explorer</h3>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-white px-3 py-1 rounded-full border border-emerald-100">4 ACTIVE MODULES</span>
                                </div>
                                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { name: 'Dashboard', desc: 'Track assessments & goals', path: '/module1', icon: <TrendingUp size={20} />, color: 'bg-emerald-600', hover: 'hover:bg-emerald-50' },
                                        { name: 'Quiz Builder', desc: 'AI-powered quiz generation', path: '/module2', icon: <BookOpen size={20} />, color: 'bg-amber-500', hover: 'hover:bg-amber-50' },
                                        { name: 'Peer Sessions', desc: 'Peer study session booking', path: '/module3', icon: <Users size={20} />, color: 'bg-emerald-700', hover: 'hover:bg-emerald-50' },
                                        { name: 'Member Finder', desc: 'Find teammates and groups', path: '/module4', icon: <Search size={20} />, color: 'bg-orange-600', hover: 'hover:bg-orange-50' },
                                    ].map((mod, i) => (
                                        <Link key={i} to={mod.path} className={`flex items-center gap-5 p-5 rounded-3xl transition-all border border-transparent ${mod.hover} hover:border-emerald-100 group`}>
                                            <div className={`w-14 h-14 ${mod.color} rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105`}>
                                                {mod.icon}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="font-black text-[#276332] text-sm uppercase tracking-tight">{mod.name}</p>
                                                <p className="text-xs text-slate-500 font-medium mt-0.5">{mod.desc}</p>
                                            </div>
                                            <ChevronRight size={18} className="text-slate-300 group-hover:text-[#276332] transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activities/Groups */}
                            <div className="bg-white rounded-[2.5rem] border border-emerald-50 overflow-hidden shadow-sm shadow-emerald-900/5">
                                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                                    <h3 className="font-black text-[#276332] uppercase tracking-widest text-xs text-left">My Active Groups</h3>
                                    <Link to="/module4" className="text-[10px] font-black text-emerald-600 hover:underline uppercase tracking-widest">View All</Link>
                                </div>
                                {groups.length > 0 ? (
                                    <div className="p-4 grid grid-cols-1 gap-3">
                                        {groups.slice(0, 3).map((group, i) => (
                                            <Link key={i} to={`/module4/group/${group._id}`} className="flex items-center gap-4 p-4 hover:bg-emerald-50/50 rounded-2xl transition-all border border-transparent hover:border-emerald-50 group">
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-emerald-100 flex items-center justify-center text-[#276332] font-black text-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                                    {group.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="font-bold text-[#276332] text-base">{group.name}</p>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{group.moduleCode} • {group.members?.length} members</p>
                                                </div>
                                                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-widest">
                                                    {group.status}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                                            <Users size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">No active groups found</p>
                                        <Link to="/module4" className="text-xs text-[#276332] font-black hover:underline mt-2 inline-block uppercase tracking-widest">Create One Now</Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Compact Profile */}
                            <div className="bg-gradient-to-br from-[#276332] to-[#556B2F] rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-[2rem] border border-white/30 p-1.5 shadow-2xl">
                                        <div className="w-full h-full bg-white rounded-[1.7rem] flex items-center justify-center text-[#276332] text-3xl font-black">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black tracking-tight">{user.name}</h4>
                                        <p className="text-emerald-100/70 text-xs font-bold uppercase tracking-widest mt-1">{user.role || 'Student'}</p>
                                    </div>
                                    
                                    <div className="w-full pt-6 space-y-3 border-t border-white/10">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                            <span className="text-emerald-100/50">ID Number</span>
                                            <span>{user.registrationNumber || 'N/A'}</span>
                                        </div>
                                        {user.role === 'student' && (
                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                                                <span className="text-emerald-100/50">Group</span>
                                                <span>MG{String(user.mainGroup || 0).padStart(2, '0')} · SG{user.subGroup || 0}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notifications/Invitations */}
                            <div className="bg-white rounded-[2.5rem] border border-emerald-50 overflow-hidden shadow-sm shadow-emerald-900/5">
                                <div className="px-8 py-6 border-b border-slate-50 bg-amber-50/30 flex items-center gap-3">
                                    <Bell size={18} className="text-amber-500" />
                                    <h3 className="font-black text-[#D97706] uppercase tracking-widest text-xs text-left">Alerts</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    {invitations.length > 0 ? (
                                        invitations.slice(0, 3).map((inv, i) => (
                                            <div key={i} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4 text-left border-l-4 border-l-amber-400">
                                                <div>
                                                    <p className="text-sm font-black text-[#276332] text-left">{inv.group?.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1 text-left">Invited by: {inv.invitedBy?.name}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                const { acceptInvitation } = await import('../services/module4Api');
                                                                await acceptInvitation(inv._id);
                                                                fetchDashboardData();
                                                            } catch (e) { }
                                                        }}
                                                        className="flex-1 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl hover:bg-emerald-700 transition-colors uppercase tracking-widest"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            try {
                                                                const { declineInvitation } = await import('../services/module4Api');
                                                                await declineInvitation(inv._id);
                                                                fetchDashboardData();
                                                            } catch (e) { }
                                                        }}
                                                        className="flex-1 py-2 bg-slate-50 text-slate-400 text-[10px] font-black rounded-xl hover:bg-slate-100 transition-colors uppercase tracking-widest border border-slate-100"
                                                    >
                                                        Ignore
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-10 text-center">
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No new notifications</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
};

export default Home;
