import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Shield, Users, Mail, CreditCard, Search, Trash2, CheckCircle, Clock, LayoutGrid, Edit, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import API from '../services/api';

const AdminPanel = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, activated: 0, pending: 0 });
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [editingGroup, setEditingGroup] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        registrationNumber: '',
        role: 'student'
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchUsers();
        fetchGroups();
    }, [navigate]);

    const fetchUsers = async () => {
        try {
            const res = await API.get('/auth');
            const userList = res.data.users || [];
            setUsers(userList);

            // Calculate stats
            const activatedCount = userList.filter(u => u.isActivated).length;
            const pendingCount = userList.length - activatedCount;
            setStats({ total: userList.length, activated: activatedCount, pending: pendingCount });
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await API.get('/module4/groups');
            setGroups(res.data.groups || []);
        } catch (err) {
            console.error('Error fetching groups:', err);
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to remove this user?')) return;
        try {
            await API.delete(`/auth/${id}`);
            toast.success('User removed successfully');
            fetchUsers();
        } catch (err) {
            toast.error('Failed to remove user');
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.put(`/auth/${editingUser._id}`, editingUser);
            toast.success('User updated successfully!');
            setEditingUser(null);
            fetchUsers();

            // Note: Updated user won't see changes in their own session until they re-login or refresh their token
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    const deleteGroup = async (id) => {
        if (!window.confirm('Are you sure you want to delete/archive this group?')) return;
        try {
            await API.delete(`/module4/groups/${id}`);
            toast.success('Group deleted successfully');
            fetchGroups();
        } catch (err) {
            toast.error('Failed to delete group');
        }
    };

    const handleUpdateGroup = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.put(`/module4/groups/${editingGroup._id}`, editingGroup);
            toast.success('Group updated successfully!');
            setEditingGroup(null);
            fetchGroups();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to update group');
        } finally {
            setLoading(false);
        }
    };

    const generateID = (role) => {
        if (role === 'student') return '';
        const prefix = role === 'instructor' ? 'INS' : 'ADMIN';
        const random = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}${random}`;
    };

    const handlePreRegister = async (e) => {
        e.preventDefault();

        // 1. Strict Email & IT Number Validation for Students
        if (formData.role === 'student') {
            const studentEmailRegex = /^it\d{8}@my\.sliit\.lk$/i;
            if (!studentEmailRegex.test(formData.email.trim())) {
                toast.error("Student email must be exactly: IT + 8 digits + @my.sliit.lk (e.g. IT21208876@my.sliit.lk)");
                return;
            }

            const itNumberRegex = /^IT\d{8}$/i;
            if (!itNumberRegex.test(formData.registrationNumber.trim())) {
                toast.error("IT Number must be exactly 10 characters: IT + 8 digits (e.g. IT21208876)");
                return;
            }

            // Ensure email prefix matches IT number
            const emailPrefix = formData.email.trim().split('@')[0].toUpperCase();
            const itNumber = formData.registrationNumber.trim().toUpperCase();
            if (emailPrefix !== itNumber) {
                toast.error(`Email prefix (${emailPrefix}) does not match IT Number (${itNumber}). They must be the same.`);
                return;
            }

            // 1.1 Academic Placement is REQUIRED for students
            if (!formData.year) {
                toast.error("Please select a Year (Y1–Y4) for this student.");
                return;
            }
            if (!formData.semester) {
                toast.error("Please select a Semester (S1 or S2) for this student.");
                return;
            }
            if (!formData.mainGroup) {
                toast.error("Please select a Main Group (MG01–MG12) for this student.");
                return;
            }
            if (!formData.subGroup) {
                toast.error("Please select a Sub Group (SG1 or SG2) for this student.");
                return;
            }
        }

        // 2. Password Length Validation (if provided)
        if (formData.password && formData.password.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        try {
            await API.post('/auth/pre-register', formData);
            toast.success(`User ${formData.registrationNumber} added successfully!`);
            fetchUsers();
            setFormData({
                email: '',
                registrationNumber: generateID(formData.role),
                role: formData.role,
                name: '',
                password: ''
            });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Pre-registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between text-left">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                        <Shield className="text-amber-500" />
                        Admin Management
                    </h1>
                    <p className="text-gray-500 mt-1">Manage users, academic placements, and study groups.</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users size={16} />
                        Users
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'groups' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <LayoutGrid size={16} />
                        Groups
                    </button>
                </div>
            </div>

            {activeTab === 'users' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6 sticky top-24 text-left shadow-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <UserPlus className="text-indigo-600" size={20} />
                                <h2 className="font-bold text-gray-900">Pre-Register Student</h2>
                            </div>
                            <p className="text-sm text-gray-500">Only students added here can register an account.</p>

                            <form onSubmit={handlePreRegister} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => {
                                            const newRole = e.target.value;
                                            setFormData({
                                                ...formData,
                                                role: newRole,
                                                registrationNumber: generateID(newRole)
                                            });
                                        }}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="student">Student</option>
                                        <option value="instructor">Instructor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email (SLIIT)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input
                                            type="email"
                                            required
                                            placeholder={formData.role === 'student' ? "IT12345678@my.sliit.lk" : "email@example.com"}
                                            value={formData.email}
                                            onChange={(e) => {
                                                const email = e.target.value;
                                                const update = { ...formData, email };

                                                // Auto-extract IT number from student email
                                                if (formData.role === 'student') {
                                                    const match = email.match(/^(it\d{8,10})@/i);
                                                    if (match) {
                                                        update.registrationNumber = match[1].toUpperCase();
                                                    }
                                                }
                                                setFormData(update);
                                            }}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Full Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 text-left">
                                        {formData.role === 'student' ? 'IT Number' : formData.role === 'instructor' ? 'Instructor ID' : 'Admin ID'}
                                    </label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            required
                                            placeholder={formData.role === 'student' ? "Auto-filled from email" : "ID (Auto-Generated)"}
                                            value={formData.registrationNumber}
                                            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                                            readOnly={formData.role === 'student'}
                                            className={`w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${
                                                formData.role === 'student' ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-gray-50'
                                            }`}
                                        />
                                        {formData.role === 'student' && formData.registrationNumber && (
                                            <span className="text-[10px] text-emerald-600 font-bold mt-1 block">✅ Extracted from email</span>
                                        )}
                                    </div>
                                </div>

                                {formData.role === 'student' && (
                                    <div className="bg-indigo-50/50 rounded-xl p-4 space-y-3 border border-indigo-100">
                                        <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Academic Placement</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Year</label>
                                                <select
                                                    value={formData.year || ''}
                                                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="Y1">Y1</option>
                                                    <option value="Y2">Y2</option>
                                                    <option value="Y3">Y3</option>
                                                    <option value="Y4">Y4</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Semester</label>
                                                <select
                                                    value={formData.semester || ''}
                                                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="S1">S1</option>
                                                    <option value="S2">S2</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Main Group</label>
                                                <select
                                                    value={formData.mainGroup || ''}
                                                    onChange={(e) => setFormData({ ...formData, mainGroup: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="">Select</option>
                                                    {[...Array(12)].map((_, i) => (
                                                        <option key={i + 1} value={i + 1}>MG{String(i + 1).padStart(2, '0')}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sub Group</label>
                                                <select
                                                    value={formData.subGroup || ''}
                                                    onChange={(e) => setFormData({ ...formData, subGroup: e.target.value })}
                                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="1">SG1</option>
                                                    <option value="2">SG2</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 text-left flex justify-between">
                                        Password (Optional)
                                        <span className="text-[10px] text-indigo-500">Activates account instantly</span>
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.password || ''}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>

                                <Button type="submit" fullWidth disabled={loading}>
                                    {loading ? 'Processing...' : 'Whitelist User'}
                                </Button>
                            </form>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between text-left">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Waitlisted (Pending)</p>
                                    <p className="text-2xl font-black text-gray-900 mt-1">{stats.pending}</p>
                                </div>
                                <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                                    <Clock size={20} />
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between text-left">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Activated Users</p>
                                    <p className="text-2xl font-black text-emerald-600 mt-1">{stats.activated}</p>
                                </div>
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                                    <CheckCircle size={20} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-left">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Users size={18} className="text-indigo-600" />
                                    Account Controls
                                </h3>
                                <span className="text-[10px] font-bold text-gray-400">Showing {users.length} users</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-[10px] font-bold">
                                        <tr>
                                            <th className="px-6 py-3">User / Email</th>
                                            <th className="px-6 py-3">ID Number</th>
                                            <th className="px-6 py-3">Placement</th>
                                            <th className="px-6 py-3">Role</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {users.map((u) => (
                                            <tr key={u._id} className={`hover:bg-gray-50/50 transition-colors ${u.registrationNumber === 'IT21208891' ? 'bg-amber-50/20' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">{u.name || 'Pending Name'}</p>
                                                    <p className="text-xs text-gray-400">{u.email}</p>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">{u.registrationNumber}</td>
                                                <td className="px-6 py-4">
                                                    {u.role === 'student' && u.year ? (
                                                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                                                            {u.year}·{u.semester}·MG{String(u.mainGroup).padStart(2, '0')}·SG{u.subGroup}
                                                        </span>
                                                    ) : u.role === 'student' ? (
                                                        <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold animate-pulse">
                                                            Missing Info
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 capitalize">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                                                        u.role === 'instructor' ? 'bg-indigo-100 text-indigo-700' :
                                                            'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setEditingUser({ ...u })}
                                                            className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteUser(u._id)}
                                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 text-left">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <LayoutGrid size={18} className="text-indigo-600" />
                                All Study Groups
                            </h3>
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
                                {groups.length} Groups
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-[10px] font-bold">
                                    <tr>
                                        <th className="px-6 py-3">Group Name</th>
                                        <th className="px-6 py-3">Module</th>
                                        <th className="px-6 py-3">Placement</th>
                                        <th className="px-6 py-3">Members</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {groups.map((g) => (
                                        <tr key={g._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-gray-900">{g.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold text-[10px] uppercase">
                                                    {g.moduleCode}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono">
                                                {g.year}·{g.semester}·MG{String(g.mainGroup).padStart(2, '0')}·SG{g.subGroup}
                                            </td>
                                            <td className="px-6 py-4">
                                                {g.members?.filter(m => m.status === 'active').length} / {g.maxMembers}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => setEditingGroup({ ...g })} className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => deleteGroup(g._id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Edit size={20} />
                                Edit User Profile
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="hover:bg-white/20 p-1 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={editingUser.name || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">IT Number / ID</label>
                                <input
                                    type="text"
                                    value={editingUser.registrationNumber || ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, registrationNumber: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            {editingUser.role === 'student' && (
                                <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Academic Placement</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Year</label>
                                            <select
                                                value={editingUser.year || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, year: e.target.value })}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="">Select</option>
                                                <option value="Y1">Y1</option>
                                                <option value="Y2">Y2</option>
                                                <option value="Y3">Y3</option>
                                                <option value="Y4">Y4</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Semester</label>
                                            <select
                                                value={editingUser.semester || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, semester: e.target.value })}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="">Select</option>
                                                <option value="S1">S1</option>
                                                <option value="S2">S2</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Main Group</label>
                                            <select
                                                value={editingUser.mainGroup || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, mainGroup: e.target.value })}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="">Select</option>
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>MG{String(i + 1).padStart(2, '0')}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Sub Group</label>
                                            <select
                                                value={editingUser.subGroup || ''}
                                                onChange={(e) => setEditingUser({ ...editingUser, subGroup: e.target.value })}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            >
                                                <option value="">Select</option>
                                                <option value="1">SG1</option>
                                                <option value="2">SG2</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                                >
                                    {loading ? 'Saving...' : 'Update User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Group Modal */}
            {editingGroup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 text-left">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
                            <h3 className="font-bold text-lg">Edit Group: {editingGroup.name}</h3>
                            <button onClick={() => setEditingGroup(null)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleUpdateGroup} className="p-6 space-y-4">
                            <input
                                type="text"
                                value={editingGroup.name}
                                onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm"
                            />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditingGroup(null)} className="flex-1 py-2 bg-gray-100 rounded-xl">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-xl">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
