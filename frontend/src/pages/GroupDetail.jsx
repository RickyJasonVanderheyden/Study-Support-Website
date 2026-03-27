import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, BarChart3, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { getGroupById } from '../services/module4Api';
import StatusBadge from '../components/module4/StatusBadge';
import MembersTab from '../components/module4/MembersTab';
import ActivityTab from '../components/module4/ActivityTab';
import SettingsTab from '../components/module4/SettingsTab';

const TABS = [
    { key: 'members', label: 'Members', icon: <Users size={16} /> },
    { key: 'activity', label: 'Activity & Reports', icon: <BarChart3 size={16} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

const GroupDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('members');
    const currentUser = JSON.parse(localStorage.getItem('user'));

    const fetchGroup = async () => {
        try {
            const res = await getGroupById(id);
            setGroup(res.data.group);
        } catch (error) {
            toast.error('Failed to load group');
            navigate('/module4');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroup();
        // eslint-disable-next-line
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!group) return null;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header / Breadcrumb - Left aligned below main header */}
            <div className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between text-left">
                <div className="flex items-center gap-4">
                    <Link to="/module4" className="text-gray-400 hover:text-indigo-600 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="text-left">
                        <h2 className="text-2xl font-bold text-gray-900">{group.name}</h2>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <StatusBadge status={group.status} />
                            <span>•</span>
                            <span className="font-semibold text-indigo-600">{group.moduleCode}</span>
                            <span>•</span>
                            <span>{group.semester}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{group.members.length} / {group.maxMembers} Members Joined</p>
                    <div className="w-48 h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-indigo-600 transition-all duration-500"
                            style={{ width: `${(group.members.length / group.maxMembers) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-8">
                <div className="flex gap-8">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-1 py-4 text-sm font-semibold border-b-2 transition-all duration-200 ${activeTab === tab.key
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300'
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <main className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    {activeTab === 'members' && (
                        <MembersTab group={group} currentUser={currentUser} onRefresh={fetchGroup} />
                    )}
                    {activeTab === 'activity' && (
                        <ActivityTab group={group} />
                    )}
                    {activeTab === 'settings' && (
                        <SettingsTab group={group} currentUser={currentUser} onRefresh={fetchGroup} />
                    )}
                </div>
            </main>
        </div>
    );
};

export default GroupDetail;
