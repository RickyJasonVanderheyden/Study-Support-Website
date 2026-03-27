import React, { useEffect, useState } from 'react';
import { X, Users, BookOpen, Award } from 'lucide-react';
import { getMemberProfile } from '../../services/module4Api';
import StatusBadge from './StatusBadge';
import RoleBadge from './RoleBadge';

const MemberProfileModal = ({ userId, onClose }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getMemberProfile(userId);
                setProfile(res.data.profile);
            } catch (err) {
                console.error('Failed to load profile', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userId]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h2 className="text-lg font-bold text-gray-900">Member Profile</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-400">Loading profile...</div>
                ) : profile ? (
                    <div className="p-6">
                        {/* Avatar & Basic Info */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl">
                                {profile.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{profile.name}</h3>
                                <p className="text-sm text-gray-500">{profile.registrationNumber}</p>
                                <p className="text-sm text-gray-500">{profile.email}</p>
                            </div>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <p className="text-sm text-gray-700">{profile.bio}</p>
                            </div>
                        )}

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-indigo-50 rounded-lg p-3 text-center">
                                <Users size={18} className="mx-auto text-indigo-500 mb-1" />
                                <p className="text-lg font-bold text-indigo-700">{profile.totalGroups}</p>
                                <p className="text-xs text-indigo-500">Groups</p>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 text-center">
                                <Award size={18} className="mx-auto text-green-500 mb-1" />
                                <p className="text-lg font-bold text-green-700">{profile.averageContribution}%</p>
                                <p className="text-xs text-green-500">Avg Contribution</p>
                            </div>
                        </div>

                        {/* Skills */}
                        {profile.skills && profile.skills.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Skills</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {profile.skills.map((skill, i) => (
                                        <span key={i} className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full text-xs font-medium">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Groups */}
                        {profile.groups && profile.groups.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold text-gray-700 mb-2">Groups</p>
                                <div className="space-y-2">
                                    {profile.groups.map((g, i) => (
                                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{g.name}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <BookOpen size={12} />
                                                    <span>{g.moduleCode} • {g.semester}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <RoleBadge role={g.role} />
                                                <StatusBadge status={g.status} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-400">Profile not found</div>
                )}
            </div>
        </div>
    );
};

export default MemberProfileModal;
