import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import StatusBadge from './StatusBadge';
import { updateGroup, deleteGroup, sendInvitation, getSentInvitations, searchUsersToAdd } from '../../services/module4Api';

const SEMESTERS = ['Y1S1', 'Y1S2', 'Y2S1', 'Y2S2', 'Y3S1', 'Y3S2', 'Y4S1', 'Y4S2'];

const SettingsTab = ({ group, currentUser, onRefresh }) => {
    const [invitations, setInvitations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [inviteMessage, setInviteMessage] = useState('');
    const [saving, setSaving] = useState(false);

    const isLeader = group.members.some(
        m => m.user._id === currentUser.id && m.role === 'leader'
    );

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            name: group.name,
            description: group.description,
            moduleCode: group.moduleCode,
            semester: group.semester,
            maxMembers: group.maxMembers,
            tags: group.tags?.join(', '),
            status: group.status
        }
    });

    useEffect(() => {
        const fetchInvitations = async () => {
            try {
                const res = await getSentInvitations(group._id);
                setInvitations(res.data.invitations);
            } catch (err) {
                console.error('Failed to load invitations', err);
            }
        };
        fetchInvitations();
    }, [group._id]);

    // Search users for invitation
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

    const handleUpdate = async (data) => {
        setSaving(true);
        try {
            data.tags = data.tags ? data.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
            data.maxMembers = parseInt(data.maxMembers);
            await updateGroup(group._id, data);
            toast.success('Group updated!');
            onRefresh();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to archive this group? This action cannot be undone.')) return;
        try {
            await deleteGroup(group._id);
            toast.success('Group archived');
            window.location.href = '/module4';
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to archive');
        }
    };

    const handleSendInvite = async (userId) => {
        try {
            await sendInvitation({ groupId: group._id, userId, message: inviteMessage });
            toast.success('Invitation sent!');
            setSearchQuery('');
            setSearchResults([]);
            setInviteMessage('');
            const res = await getSentInvitations(group._id);
            setInvitations(res.data.invitations);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send invitation');
        }
    };

    if (!isLeader) {
        return (
            <div className="text-center text-gray-400 py-12">
                <p className="text-lg">Only the group leader can access settings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Edit Group Form */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-md font-bold text-gray-900 mb-4">Edit Group Details</h4>
                <form onSubmit={handleSubmit(handleUpdate)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                        <input {...register('name', { required: true })} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea {...register('description')} rows="2" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Module Code</label>
                            <input {...register('moduleCode')} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none uppercase" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                            <select {...register('semester')} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select {...register('status')} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                        <input {...register('tags')} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
                </form>
            </div>

            {/* Send Invitation */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-md font-bold text-gray-900 mb-4">Send Invitation</h4>
                <div className="relative mb-3">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Search student by name, IT number or email..."
                    />
                </div>
                <input
                    value={inviteMessage}
                    onChange={e => setInviteMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none mb-3"
                    placeholder="Optional message: Hey, join our group!"
                />
                {searching && <p className="text-sm text-gray-400">Searching...</p>}
                <div className="space-y-2 max-h-40 overflow-y-auto">
                    {searchResults.map(user => (
                        <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.registrationNumber}</p>
                            </div>
                            <button onClick={() => handleSendInvite(user._id)} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                <Send size={14} /> Invite
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sent Invitations */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-md font-bold text-gray-900 mb-4">Sent Invitations ({invitations.length})</h4>
                {invitations.length > 0 ? (
                    <div className="space-y-2">
                        {invitations.map(inv => (
                            <div key={inv._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium text-sm">{inv.invitedUser?.name}</p>
                                    <p className="text-xs text-gray-500">{inv.invitedUser?.registrationNumber} • {new Date(inv.createdAt).toLocaleDateString()}</p>
                                </div>
                                <StatusBadge status={inv.status} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm">No invitations sent yet</p>
                )}
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <h4 className="text-md font-bold text-red-700 mb-2">Danger Zone</h4>
                <p className="text-sm text-red-600 mb-4">Archiving the group will hide it from all members. This cannot be undone.</p>
                <Button variant="danger" onClick={handleDelete}>Archive Group</Button>
            </div>
        </div>
    );
};

export default SettingsTab;
