import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Activity, Users, TrendingUp, Calendar } from 'lucide-react';
import { getActivityTimeline, getActivityStats, getContributions } from '../../services/module4Api';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

const ACTION_ICONS = {
    group_created: '🆕',
    group_updated: '✏️',
    group_deleted: '🗑️',
    member_added: '➕',
    member_removed: '❌',
    member_left: '🚪',
    member_role_changed: '🔄',
    member_status_changed: '📊',
    contribution_updated: '⭐',
    invitation_sent: '📨',
    invitation_accepted: '✅',
    invitation_declined: '🚫',
    leadership_transferred: '👑',
};

const ActivityTab = ({ group }) => {
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState(null);
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [actRes, statsRes, contribRes] = await Promise.all([
                    getActivityTimeline(group._id, page),
                    getActivityStats(group._id),
                    getContributions(group._id)
                ]);
                setActivities(actRes.data.activities);
                setPagination(actRes.data.pagination);
                setStats(statsRes.data.stats);
                setContributions(contribRes.data.contributions);
            } catch (err) {
                console.error('Failed to load activity data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [group._id, page]);

    if (loading) {
        return <div className="text-center text-gray-400 py-12">Loading reports...</div>;
    }

    const pieData = stats?.members?.map((m, i) => ({
        name: m.user.name,
        value: m.totalActions || 1
    })) || [];

    return (
        <div className="space-y-8">
            {/* Summary Stats */}
            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <Users size={20} className="mx-auto text-indigo-500 mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{stats.summary.totalMembers}</p>
                        <p className="text-xs text-gray-500">Total Members</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <Activity size={20} className="mx-auto text-green-500 mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{stats.summary.totalActivities}</p>
                        <p className="text-xs text-gray-500">Total Activities</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <TrendingUp size={20} className="mx-auto text-orange-500 mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{stats.summary.averageContribution}%</p>
                        <p className="text-xs text-gray-500">Avg Contribution</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <Calendar size={20} className="mx-auto text-purple-500 mb-2" />
                        <p className="text-2xl font-bold text-gray-900">{stats.summary.groupAgeDays}</p>
                        <p className="text-xs text-gray-500">Days Active</p>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contribution Bar Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-md font-bold text-gray-900 mb-4">Contribution Scores</h4>
                    {contributions.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={contributions} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value) => [`${value}%`, 'Contribution']} />
                                <Bar dataKey="contributionScore" fill="#6366f1" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-400 text-center py-8">No data yet</p>
                    )}
                </div>

                {/* Participation Pie Chart */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <h4 className="text-md font-bold text-gray-900 mb-4">Participation Distribution</h4>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-400 text-center py-8">No data yet</p>
                    )}
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h4 className="text-md font-bold text-gray-900 mb-4">Activity Timeline</h4>
                {activities.length > 0 ? (
                    <div className="space-y-3">
                        {activities.map((activity, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <span className="text-xl mt-0.5">{ACTION_ICONS[activity.action] || '📌'}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-900">{activity.details}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <span className="font-medium">{activity.performedBy?.name}</span>
                                        <span>•</span>
                                        <span>{new Date(activity.createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-center py-8">No activity recorded yet</p>
                )}

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="flex justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-600">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                            disabled={page === pagination.pages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 text-sm rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityTab;
