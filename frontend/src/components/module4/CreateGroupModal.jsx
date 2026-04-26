import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { X, RefreshCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import API from '../../services/api';
import { createGroup, checkModuleMembership } from '../../services/module4Api';

const CreateGroupModal = ({ isOpen, onClose, onCreated }) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
    const [moduleConflict, setModuleConflict] = useState(null); // { groupName, moduleCode }
    const [checkingModule, setCheckingModule] = useState(false);
    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();

    const watchedModuleCode = watch('moduleCode');

    // Re-check local storage when modal opens
    useEffect(() => {
        if (isOpen) {
            setUser(JSON.parse(localStorage.getItem('user')));
            setModuleConflict(null);
        }
    }, [isOpen]);

    // Debounced module code check
    useEffect(() => {
        if (!watchedModuleCode || watchedModuleCode.trim().length < 2) {
            setModuleConflict(null);
            return;
        }

        const timer = setTimeout(async () => {
            setCheckingModule(true);
            try {
                const res = await checkModuleMembership(watchedModuleCode.trim());
                if (res.data.alreadyInGroup) {
                    setModuleConflict({
                        groupName: res.data.existingGroup.name,
                        moduleCode: res.data.existingGroup.moduleCode
                    });
                } else {
                    setModuleConflict(null);
                }
            } catch (err) {
                // Silently fail — backend guards will still catch it
                setModuleConflict(null);
            } finally {
                setCheckingModule(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [watchedModuleCode]);

    if (!isOpen) return null;

    const handleRefreshProfile = async () => {
        setRefreshing(true);
        try {
            const res = await API.get('/auth/me');
            const updatedUser = res.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            toast.success("Profile sync complete!");
        } catch (err) {
            toast.error("Failed to sync profile.");
        } finally {
            setRefreshing(false);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            data.tags = data.tags ? data.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
            const res = await createGroup(data);
            toast.success('Group created successfully!');
            reset();
            setModuleConflict(null);
            onCreated(res.data.group);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'instructor';
    const hasPlacement = isAdmin || (user?.year && user?.semester && user?.mainGroup && user?.subGroup);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Create New Project Team</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
                    {!hasPlacement && !isAdmin && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2 text-left">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-bold text-amber-800">⚠️ Academic placement missing</p>
                                    <p className="text-xs text-amber-600 mt-1">
                                        If an admin recently assigned your class, click the sync button to refresh your profile.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRefreshProfile}
                                    disabled={refreshing}
                                    className="px-3 py-1.5 bg-amber-200 text-amber-800 font-bold text-[10px] uppercase tracking-wider rounded-lg hover:bg-amber-300 transition-colors flex items-center gap-1 shrink-0"
                                >
                                    <RefreshCcw size={12} className={refreshing ? "animate-spin" : ""} />
                                    {refreshing ? "Syncing..." : "Sync My Profile"}
                                </button>
                            </div>
                        </div>
                    )}
                    {isAdmin && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                            <p className="text-sm font-bold text-amber-800">🛡️ Admin Mode — Full Access</p>
                            <p className="text-xs text-amber-600 mt-0.5">You can create groups for any sub-group. The group will be visible to all students.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Name (Group Name) *</label>
                        <input
                            {...register('name', { required: 'Team name is required', minLength: { value: 3, message: 'Min 3 characters' } })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            placeholder="e.g., SE3040 - Team Alpha"
                            disabled={!hasPlacement}
                        />
                        {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Module Code *</label>
                            <input
                                {...register('moduleCode', { required: 'Module code is required' })}
                                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none uppercase ${
                                    moduleConflict ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                }`}
                                placeholder="SE3040"
                                disabled={!hasPlacement}
                            />
                            {errors.moduleCode && <span className="text-red-500 text-xs mt-1">{errors.moduleCode.message}</span>}
                            {checkingModule && (
                                <span className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                                    <span className="animate-spin inline-block w-3 h-3 border border-gray-300 border-t-emerald-500 rounded-full"></span>
                                    Checking...
                                </span>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 uppercase font-bold text-xs text-gray-400">Team Size</label>
                            <div className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 font-bold">
                                4 Members Capped
                            </div>
                        </div>
                    </div>

                    {/* Module conflict warning */}
                    {moduleConflict && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left flex items-start gap-3">
                            <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-red-800">
                                    You're already in a group for {moduleConflict.moduleCode}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                    You are a member of <strong>"{moduleConflict.groupName}"</strong> for this module.
                                    A student can only be in one group per module. Leave that group first if you want to create a new one.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 text-left">
                        <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Class Scope</p>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-emerald-900">
                                {isAdmin
                                    ? 'All Sub-Groups (Admin)'
                                    : hasPlacement
                                        ? `${user.year} · ${user.semester} · MG${String(user.mainGroup).padStart(2, '0')} · SG${user.subGroup}`
                                        : 'Placement Not Assigned'
                                }
                            </p>
                            <p className="text-[10px] text-emerald-500 italic">{isAdmin ? 'Admin override' : 'Auto-assigned'}</p>
                        </div>
                        <p className="text-[10px] text-emerald-400 mt-2">
                            {isAdmin ? 'Admin groups are visible to all students.' : 'This group will only be visible to students in your sub-group.'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Description</label>
                        <textarea
                            {...register('description')}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                            rows="2"
                            placeholder="Briefly describe your team goals..."
                            disabled={!hasPlacement}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Focus (Tags)</label>
                        <input
                            {...register('tags')}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                            placeholder="e.g. react, node, ai (comma separated)"
                            disabled={!hasPlacement}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" fullWidth disabled={loading || !hasPlacement || (!isAdmin && !!moduleConflict)}>
                            {loading ? 'Creating...' : 'Create Team'}
                        </Button>
                        <Button variant="secondary" fullWidth onClick={onClose} type="button">Cancel</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
