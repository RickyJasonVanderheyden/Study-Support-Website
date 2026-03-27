import React from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

const GroupCard = ({ group }) => {
    const activeMembers = group.members?.filter(m => m.status === 'active').length || 0;
    const totalMembers = group.members?.length || 0;

    return (
        <Link to={`/module4/group/${group._id}`} className="group outline-none">
            <div className="bg-white rounded-xl border-2 border-gray-100 p-6 hover:border-indigo-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {group.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{group.description || 'No description'}</p>
                    </div>
                    <StatusBadge status={group.status} />
                </div>

                {/* Details */}
                <div className="flex-1 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-indigo-500" />
                        <span className="font-medium">{group.moduleCode}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-500" />
                        <span>{group.semester} • {group.academicYear}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-indigo-500" />
                        <span>{activeMembers} active / {totalMembers} total (max {group.maxMembers})</span>
                    </div>
                </div>

                {/* Tags */}
                {group.tags && group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                        {group.tags.map((tag, i) => (
                            <span key={i} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-xs font-medium">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
};

export default GroupCard;
