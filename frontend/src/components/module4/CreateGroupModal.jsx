import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import { createGroup } from '../../services/module4Api';

// Removed SEMESTERS list as it's no longer used for manual input

const CreateGroupModal = ({ isOpen, onClose, onCreated }) => {
    const [loading, setLoading] = useState(false);
    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const user = JSON.parse(localStorage.getItem('user'));

    if (!isOpen) return null;

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            data.tags = data.tags ? data.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];
            const res = await createGroup(data);
            toast.success('Group created successfully!');
            reset();
            onCreated(res.data.group);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    const hasPlacement = user?.year && user?.semester && user?.mainGroup && user?.subGroup;

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
                    {!hasPlacement && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2 text-left">
                            <p className="text-sm font-bold text-amber-800">⚠️ Academic placement missing</p>
                            <p className="text-xs text-amber-600 mt-1">
                                You must have your Year, Semester, and Group assigned to create a team.
                                Please contact an admin to update your placement.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Name (Group Name) *</label>
                        <input
                            {...register('name', { required: 'Team name is required', minLength: { value: 3, message: 'Min 3 characters' } })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="e.g., IT3040 - Team Alpha"
                            disabled={!hasPlacement}
                        />
                        {errors.name && <span className="text-red-500 text-xs mt-1">{errors.name.message}</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Module Code *</label>
                            <input
                                {...register('moduleCode', { required: 'Module code is required' })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none uppercase"
                                placeholder="IT3040"
                                disabled={!hasPlacement}
                            />
                            {errors.moduleCode && <span className="text-red-500 text-xs mt-1">{errors.moduleCode.message}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 uppercase font-bold text-xs text-gray-400">Team Size</label>
                            <div className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 font-bold">
                                4 Members Capped
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 text-left">
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Class Scope</p>
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-indigo-900">
                                {hasPlacement
                                    ? `${user.year} · ${user.semester} · MG${String(user.mainGroup).padStart(2, '0')} · SG${user.subGroup}`
                                    : 'Placement Not Assigned'
                                }
                            </p>
                            <p className="text-[10px] text-indigo-500 italic">Auto-assigned</p>
                        </div>
                        <p className="text-[10px] text-indigo-400 mt-2">
                            This group will only be visible to students in your sub-group.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Description</label>
                        <textarea
                            {...register('description')}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                            rows="2"
                            placeholder="Briefly describe your team goals..."
                            disabled={!hasPlacement}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Project Focus (Tags)</label>
                        <input
                            {...register('tags')}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            placeholder="e.g. react, node, ai (comma separated)"
                            disabled={!hasPlacement}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" fullWidth disabled={loading || !hasPlacement}>
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
