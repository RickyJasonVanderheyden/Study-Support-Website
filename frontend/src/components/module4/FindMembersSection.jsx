import React, { useState, useEffect } from 'react';
import { Search, Users, Send, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { browseMembers, sendInvitation } from '../../services/module4Api';

const FindMembersSection = ({ groups = [] }) => {
    const [members, setMembers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [placement, setPlacement] = useState(null);
    const [inviteModalUser, setInviteModalUser] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [sending, setSending] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await browseMembers(searchQuery);
            setMembers(res.data.users || []);
            const currentPlacement = res.data.currentPlacement || null;
            setPlacement(currentPlacement);

            // Auto-sync profile to local storage if it was updated by an admin in the background
            const localUser = JSON.parse(localStorage.getItem('user')) || {};
            if (currentPlacement?.year && (!localUser.year || localUser.year !== currentPlacement.year)) {
                const updatedUser = { ...localUser, ...currentPlacement };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                window.dispatchEvent(new Event('storage'));
            }
        } catch (err) {
            console.error('Browse failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMembers();
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Check if a member is already in a group for the selected group's module
    const getMemberConflict = (member) => {
        if (!selectedGroup || !member.existingGroups?.length) return null;
        const selectedGroupObj = groups.find(g => g._id === selectedGroup);
        if (!selectedGroupObj) return null;
        return member.existingGroups.find(eg => eg.moduleCode === selectedGroupObj.moduleCode);
    };

    const handleInvite = async () => {
        if (!selectedGroup) {
            toast.error('Please select a group first');
            return;
        }

        // Check for module conflict before sending
        const conflict = getMemberConflict(inviteModalUser);
        if (conflict) {
            toast.error(`${inviteModalUser.name} is already in "${conflict.groupName}" for ${conflict.moduleCode}`);
            return;
        }

        setSending(true);
        try {
            await sendInvitation({
                groupId: selectedGroup,
                userId: inviteModalUser._id,
                message: inviteMessage
            });
            toast.success(`Invitation sent to ${inviteModalUser.name}!`);
            setInviteModalUser(null);
            setInviteMessage('');
            setSelectedGroup('');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to send invitation');
        } finally {
            setSending(false);
        }
    };

    const formatPlacement = (u) => {
        const parts = [];
        if (u.year) parts.push(u.year);
        if (u.semester) parts.push(u.semester);
        if (u.mainGroup) parts.push(`MG${String(u.mainGroup).padStart(2, '0')}`);
        if (u.subGroup) parts.push(`SG${u.subGroup}`);
        return parts.join(' · ');
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'instructor';
    const hasPlacement = isAdmin || (placement && placement.year && placement.semester && placement.mainGroup && placement.subGroup);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            {/* Header */}
            <div className={`px-6 py-5 border-b border-gray-100 bg-gradient-to-r ${isAdmin ? 'from-amber-50 to-orange-50' : 'from-emerald-50 to-teal-50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${isAdmin ? 'bg-amber-600' : 'bg-emerald-600'}`}>
                            <Users size={20} />
                        </div>
                        <div className="text-left">
                            <h2 className="font-bold text-gray-900 text-lg">Find Group Members</h2>
                             {isAdmin ? (
                                <p className="text-xs text-gray-500">
                                    <span className="font-bold text-amber-600">🛡️ Admin View</span>
                                    <span className="text-gray-400 ml-1">— Showing all students across all sub-groups</span>
                                </p>
                            ) : hasPlacement ? (
                                <p className="text-xs text-gray-500">
                                    Your class: <span className="font-bold text-emerald-600">{placement.year} · {placement.semester} · MG{String(placement.mainGroup).padStart(2, '0')} · SG{placement.subGroup}</span>
                                    <span className="text-gray-400 ml-1">— Showing classmates from your sub-group</span>
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500">Search and invite students to your study groups</p>
                            )}
                        </div>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
                        {members.length} student{members.length !== 1 ? 's' : ''} found
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name, email, or IT number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* No placement warning */}
            {!hasPlacement && user?.role === 'student' && (
                <div className="mx-6 mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                    <p className="text-sm font-bold text-amber-800">⚠️ Academic placement not set</p>
                    <p className="text-xs text-amber-600 mt-1">
                        Your Year, Semester, Main Group, and Sub Group are not configured yet.
                        Ask your admin to update your placement so you can find classmates from your sub-group.
                    </p>
                </div>
            )}

            {/* Member Cards */}
            {loading ? (
                <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-400">Searching students...</p>
                </div>
            ) : members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {members.map(member => (
                        <div
                            key={member._id}
                            className="bg-gray-50 rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-emerald-200 transition-all group"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                                    {member.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="font-semibold text-gray-900 truncate">{member.name || 'No Name'}</p>
                                    <p className="text-xs text-gray-400 truncate">{member.email}</p>
                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                        {member.registrationNumber && (
                                            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                                                {member.registrationNumber}
                                            </span>
                                        )}
                                        {formatPlacement(member) && (
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                                                {formatPlacement(member)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Existing Group Badges — shows which modules this member is already in */}
                            {member.existingGroups && member.existingGroups.length > 0 && (
                                <div className="mt-2.5 flex flex-wrap gap-1">
                                    {member.existingGroups.map((eg, i) => (
                                        <span
                                            key={i}
                                            className="text-[10px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                                            title={`Already in "${eg.groupName}" for ${eg.moduleCode}`}
                                        >
                                            <UserCheck size={10} />
                                            {eg.moduleCode}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Skills */}
                            {member.skills && member.skills.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {member.skills.slice(0, 4).map((skill, i) => (
                                        <span key={i} className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                    {member.skills.length > 4 && (
                                        <span className="text-[10px] text-gray-400">+{member.skills.length - 4} more</span>
                                    )}
                                </div>
                            )}

                            {/* Bio */}
                            {member.bio && (
                                <p className="mt-2 text-xs text-gray-500 line-clamp-2 text-left">{member.bio}</p>
                            )}

                            {/* Invite Button */}
                            {groups.length > 0 && (
                                <button
                                    onClick={() => setInviteModalUser(member)}
                                    className="mt-3 w-full flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700 transition-all opacity-80 group-hover:opacity-100"
                                >
                                    <Send size={12} />
                                    Invite to Group
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search size={24} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm">
                        {hasPlacement
                            ? 'No classmates found in your sub-group yet. They will appear once registered.'
                            : 'No students found. Try a different search.'
                        }
                    </p>
                </div>
            )}

            {/* Invite Modal */}
            {inviteModalUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setInviteModalUser(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-left" onClick={(e) => e.stopPropagation()}>
                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                            Invite {inviteModalUser.name}
                        </h3>
                        <p className="text-sm text-gray-500 mb-1">
                            Send a group invitation to <strong>{inviteModalUser.email}</strong>
                        </p>
                        {formatPlacement(inviteModalUser) && (
                            <p className="text-xs text-emerald-600 font-bold mb-2">
                                {formatPlacement(inviteModalUser)}
                            </p>
                        )}

                        {/* Show which groups this person is already in */}
                        {inviteModalUser.existingGroups && inviteModalUser.existingGroups.length > 0 && (
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-left">
                                <p className="text-xs font-bold text-orange-800 mb-1.5 flex items-center gap-1">
                                    <UserCheck size={12} />
                                    Already in group(s):
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {inviteModalUser.existingGroups.map((eg, i) => (
                                        <span key={i} className="text-[11px] bg-white text-orange-700 border border-orange-200 px-2 py-0.5 rounded-lg font-semibold">
                                            {eg.moduleCode} — "{eg.groupName}"
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[10px] text-orange-500 mt-2 italic">
                                    This student cannot join another group for the same module.
                                </p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Select Group</label>
                                <select
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="">Choose a group...</option>
                                    {groups
                                        .filter(g => 
                                            g.year === inviteModalUser.year &&
                                            g.semester === inviteModalUser.semester &&
                                            g.mainGroup === inviteModalUser.mainGroup &&
                                            g.subGroup === inviteModalUser.subGroup
                                        )
                                        .map(g => {
                                            // Check if the user is already in a group for this module
                                            const conflict = inviteModalUser.existingGroups?.find(eg => eg.moduleCode === g.moduleCode);
                                            return (
                                                <option
                                                    key={g._id}
                                                    value={g._id}
                                                    disabled={!!conflict}
                                                >
                                                    {g.name} ({g.moduleCode}){conflict ? ' — ❌ Already in a group' : ''}
                                                </option>
                                            );
                                        })}
                                    {groups.filter(g => 
                                        g.year === inviteModalUser.year &&
                                        g.semester === inviteModalUser.semester &&
                                        g.mainGroup === inviteModalUser.mainGroup &&
                                        g.subGroup === inviteModalUser.subGroup
                                    ).length === 0 && (
                                        <option disabled>No groups found for this student's sub-group</option>
                                    )}
                                </select>

                                {/* Inline conflict warning when a group is selected */}
                                {selectedGroup && getMemberConflict(inviteModalUser) && (
                                    <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-left">
                                        <p className="text-xs text-red-700 font-semibold">
                                            ❌ {inviteModalUser.name} is already in "{getMemberConflict(inviteModalUser).groupName}" for {getMemberConflict(inviteModalUser).moduleCode}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Message (Optional)</label>
                                <textarea
                                    value={inviteMessage}
                                    onChange={(e) => setInviteMessage(e.target.value)}
                                    placeholder="Hey! Would you like to join our study group?"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-20"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setInviteModalUser(null)}
                                    className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInvite}
                                    disabled={!selectedGroup || !!getMemberConflict(inviteModalUser) || sending}
                                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1.5 ${!selectedGroup || getMemberConflict(inviteModalUser) || sending
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        }`}
                                >
                                    <Send size={14} className={sending ? 'animate-spin' : ''} />
                                    {sending ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FindMembersSection;

