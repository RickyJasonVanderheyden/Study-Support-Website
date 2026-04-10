import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Trash2, ArrowRightLeft, LogOut as LeaveIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from './StatusBadge';
import RoleBadge from './RoleBadge';
import MemberProfileModal from './MemberProfileModal';
import Button from '../common/Button';
import {
    searchUsersToAdd, addMember, updateMember,
    removeMember, leaveGroup, transferLeadership
} from '../../services/module4Api';

const MembersTab = ({ group, currentUser, onRefresh }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [editingMember, setEditingMember] = useState(null);
    const [contributionInput, setContributionInput] = useState('');

    const canManageMembers = group.members.some(
        m => (m.user._id === currentUser.id || m.user._id === currentUser._id) && m.role === 'leader'
    ) || currentUser.role === 'admin' || currentUser.role === 'super_admin' || currentUser.role === 'instructor';

    const isLeader = group.members.some(
        m => (m.user._id === currentUser.id || m.user._id === currentUser._id) && m.role === 'leader'
    );

    const filteredMembers = statusFilter === 'all'
        ? group.members
        : group.members.filter(m => m.status === statusFilter);

    // Search users
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await searchUsersToAdd(group._id, searchQuery);
                setSearchResults(res.data.users);
            } catch (err) {
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, group._id]);

    const handleAddMember = async (userId) => {
        try {
            await addMember(group._id, userId);
            toast.success('Member added successfully!');
            setSearchQuery('');
            setSearchResults([]);
            setShowAddModal(false);
            onRefresh();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add member');
        }
    };

    const handleRemoveMember = async (userId, name) => {
        if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
        try {
            await removeMember(group._id, userId);
            toast.success('Member removed');
            onRefresh();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to remove member');
        }
    };

    const handleStatusChange = async (userId, newStatus) => {
        try {
            await updateMember(group._id, userId, { status: newStatus });
            toast.success('Status updated');
            onRefresh();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update status');
        }
    };

    const handleContributionUpdate = async (userId) => {
        const score = parseInt(contributionInput);
        if (isNaN(score) || score < 0 || score > 100) {
            toast.error('Score must be 0-100');
            return;
        }
        try {
            await updateMember(group._id, userId, { contributionScore: score });
            toast.success('Contribution updated');
            setEditingMember(null);
            setContributionInput('');
            onRefresh();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update');
        }
    };

    const handleTransferLeadership = async (userId, name) => {
        if (!window.confirm(`Transfer leadership to ${name}? You will become a regular member.`)) return;
        try {
            await transferLeadership(group._id, userId);
            toast.success('Leadership transferred!');
            onRefresh();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to transfer');
        }
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm('Are you sure you want to leave this group?')) return;
        try {
            await leaveGroup(group._id);
            toast.success('You have left the group');
            window.location.href = '/module4';
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to leave group');
        }
    };

    return (
        <div>
            {/* Header Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">Members ({group.members.length}/{group.maxMembers})</h3>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value="active">🟢 Active</option>
                        <option value="pending">🟡 Pending</option>
                        <option value="inactive">🔴 Inactive</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    {canManageMembers && (
                        <Button size="sm" onClick={() => setShowAddModal(true)}>
                            <UserPlus size={16} className="mr-1" /> Add Member
                        </Button>
                    )}
                    {!isLeader && group.members.some(m => m.user._id === currentUser.id) && (
                        <Button size="sm" variant="danger" onClick={handleLeaveGroup}>
                            <LeaveIcon size={16} className="mr-1" /> Leave Group
                        </Button>
                    )}
                </div>
            </div>

            {/* Members List */}
            <div className="space-y-3">
                {filteredMembers.map(member => (
                    <div key={member.user._id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                                {member.user.name?.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={() => setShowProfileModal(member.user._id)}
                                        className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors text-left"
                                    >
                                        {member.user.name}
                                    </button>
                                    <RoleBadge role={member.role} />
                                    <StatusBadge status={member.status} />
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                    {member.user.registrationNumber} • {member.user.email}
                                </p>
                            </div>
                        </div>

                        {/* Contribution Score */}
                        <div className="flex items-center gap-4">
                            <div className="text-center hidden sm:block">
                                <p className="text-xs text-gray-500">Contribution</p>
                                {editingMember === member.user._id ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="number"
                                            value={contributionInput}
                                            onChange={e => setContributionInput(e.target.value)}
                                            className="w-16 border rounded px-1 py-0.5 text-sm text-center"
                                            min="0" max="100"
                                            autoFocus
                                        />
                                        <button onClick={() => handleContributionUpdate(member.user._id)} className="text-green-600 text-xs font-bold">✓</button>
                                        <button onClick={() => setEditingMember(null)} className="text-red-500 text-xs font-bold">✕</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            if (canManageMembers) {
                                                setEditingMember(member.user._id);
                                                setContributionInput(member.contributionScore.toString());
                                            }
                                        }}
                                        className={`text-lg font-bold ${canManageMembers ? 'text-indigo-600 hover:underline cursor-pointer' : 'text-gray-700 cursor-default'}`}
                                    >
                                        {member.contributionScore}%
                                    </button>
                                )}
                            </div>

                    {/* Leader/Admin Actions */}
                    {canManageMembers && member.user._id !== (currentUser.id || currentUser._id) && (
                                <div className="flex items-center gap-1">
                                    {/* Status Toggle */}
                                    <select
                                        value={member.status}
                                        onChange={e => handleStatusChange(member.user._id, e.target.value)}
                                        className="text-xs border rounded px-1 py-1 bg-white"
                                    >
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="inactive">Inactive</option>
                                    </select>

                                    {/* Transfer Leadership */}
                                    {member.status === 'active' && (
                                        <button
                                            onClick={() => handleTransferLeadership(member.user._id, member.user.name)}
                                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Transfer Leadership"
                                        >
                                            <ArrowRightLeft size={14} />
                                        </button>
                                    )}

                                    {/* Remove */}
                                    <button
                                        onClick={() => handleRemoveMember(member.user._id, member.user.name)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove Member"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredMembers.length === 0 && (
                <p className="text-center text-gray-400 py-8">No members found with this filter.</p>
            )}

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="p-6">
                            <h3 className="text-lg font-bold mb-4">Add Member</h3>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Search by name, IT number, or email..."
                                    autoFocus
                                />
                            </div>

                            {searching && <p className="text-sm text-gray-400 mt-3">Searching...</p>}

                            <div className="mt-3 max-h-60 overflow-y-auto space-y-2">
                                {searchResults.map(user => (
                                    <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors">
                                        <div>
                                            <p className="font-medium text-gray-900">{user.name}</p>
                                            <p className="text-xs text-gray-500">{user.registrationNumber} • {user.email}</p>
                                        </div>
                                        <Button size="sm" onClick={() => handleAddMember(user._id)}>Add</Button>
                                    </div>
                                ))}
                                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-4">No users found</p>
                                )}
                            </div>

                            <Button variant="secondary" fullWidth className="mt-4" onClick={() => setShowAddModal(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Modal */}
            {showProfileModal && (
                <MemberProfileModal userId={showProfileModal} onClose={() => setShowProfileModal(null)} />
            )}
        </div>
    );
};

export default MembersTab;
