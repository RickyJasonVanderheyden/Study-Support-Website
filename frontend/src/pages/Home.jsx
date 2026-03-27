import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Users, Search, Bell,
  ChevronRight, TrendingUp, UserCheck, Award, User
} from 'lucide-react';
import { getMyGroups, getReceivedInvitations } from '../services/module4Api';

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
      setLoading(false);
      navigate('/login');
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

  if (!user || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const activeGroups = groups.filter(g => g.status === 'active').length;
  const totalMembers = groups.reduce((sum, g) => sum + (g.members?.length || 0), 0);

  const statCards = [
    { label: 'My Groups', value: groups.length, icon: <Users size={22} />, color: 'from-indigo-500 to-indigo-700', change: `${activeGroups} active` },
    { label: 'Total Members', value: totalMembers, icon: <UserCheck size={22} />, color: 'from-emerald-500 to-emerald-700', change: 'Across all groups' },
    { label: 'Pending Invitations', value: invitations.length, icon: <Bell size={22} />, color: 'from-amber-500 to-amber-700', change: invitations.length > 0 ? 'Action needed' : 'All caught up' },
    { label: 'Modules Active', value: '4', icon: <Award size={22} />, color: 'from-purple-500 to-purple-700', change: 'All available' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-500">{card.label}</span>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-lg`}>
                {card.icon}
              </div>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-400 mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Modules Overview */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Modules Overview</h3>
              <span className="text-xs text-gray-400">4 modules available</span>
            </div>
            <div className="divide-y divide-gray-50">
              {[
                { name: 'Student Progress & Dashboard', desc: 'Track assessments, goals, and portfolio', path: '/module1', icon: <TrendingUp size={18} />, color: 'bg-blue-500', status: 'Available' },
                { name: 'Quiz Builder & PDF Generation', desc: 'AI-powered quizzes with Gemini', path: '/module2', icon: <BookOpen size={18} />, color: 'bg-purple-500', status: 'Available' },
                { name: 'Peer Study Sessions', desc: 'Book and manage peer sessions', path: '/module3', icon: <Users size={18} />, color: 'bg-emerald-500', status: 'Available' },
                { name: 'Group Member Finder', desc: `${groups.length} group${groups.length !== 1 ? 's' : ''} created`, path: '/module4', icon: <Search size={18} />, color: 'bg-orange-500', status: 'Active' },
              ].map((mod, i) => (
                <Link key={i} to={mod.path} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group">
                  <div className={`w-10 h-10 ${mod.color} rounded-xl flex items-center justify-center text-white shadow-md shrink-0`}>
                    {mod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{mod.name}</p>
                    <p className="text-xs text-gray-500">{mod.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${mod.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {mod.status}
                    </span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Groups */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">My Recent Groups</h3>
              <Link to="/module4" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View All →</Link>
            </div>
            {groups.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {groups.slice(0, 4).map((group, i) => (
                  <Link key={i} to={`/module4/group/${group._id}`} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors group">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0">
                      {group.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">{group.name}</p>
                      <p className="text-xs text-gray-500">{group.moduleCode} • {group.semester} • {group.members?.length} members</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${group.status === 'active' ? 'bg-green-100 text-green-700'
                      : group.status === 'completed' ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                      }`}>
                      {group.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-8 text-center text-left">
                <p className="text-sm text-gray-400 mb-3">No groups yet</p>
                <Link to="/module4" className="text-sm text-indigo-600 font-medium hover:underline">Create your first group →</Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Pending Invitations */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-left">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-left">
                <Bell size={16} className="text-amber-500" />
                Pending Invitations
              </h3>
            </div>
            {invitations.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {invitations.slice(0, 5).map((inv, i) => (
                  <div key={i} className="px-5 py-3.5 text-left">
                    <p className="text-sm font-medium text-gray-900">{inv.group?.name}</p>
                    <p className="text-xs text-gray-500 mb-2 text-left">From: {inv.invitedBy?.name}</p>
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        try {
                          const { acceptInvitation } = await import('../services/module4Api');
                          await acceptInvitation(inv._id);
                          fetchDashboardData();
                        } catch (e) { }
                      }} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                        Accept
                      </button>
                      <button onClick={async () => {
                        try {
                          const { declineInvitation } = await import('../services/module4Api');
                          await declineInvitation(inv._id);
                          fetchDashboardData();
                        } catch (e) { }
                      }} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-6 text-center text-left">
                <p className="text-sm text-gray-400">No pending invitations</p>
              </div>
            )}
          </div>

          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden text-left">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <User size={16} className="text-indigo-500" />
                My Profile
              </h3>
            </div>
            <div className="p-5 text-left">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">
                    {user.role === 'admin' ? 'Admin ID' : user.role === 'instructor' ? 'Staff ID' : 'IT Number'}
                  </span>
                  <span className="font-medium text-gray-900">{user.registrationNumber || 'N/A'}</span>
                </div>
                {user.role === 'student' && (
                  <>
                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                      <span className="text-gray-500">Class</span>
                      <span className="font-bold text-indigo-600 text-xs">
                        {user.year && user.semester && user.mainGroup && user.subGroup
                          ? `${user.year} · ${user.semester} · MG${String(user.mainGroup).padStart(2, '0')} · SG${user.subGroup}`
                          : 'Not Assigned'}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-500">Total Groups</span>
                  <span className="font-medium text-gray-900">{groups.length}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500">Role</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                    user.role === 'instructor' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                    {user.role || 'Student'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
