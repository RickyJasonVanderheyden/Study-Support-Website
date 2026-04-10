import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import GroupCard from '../components/module4/GroupCard';
import CreateGroupModal from '../components/module4/CreateGroupModal';
import FindMembersSection from '../components/module4/FindMembersSection';
import { getMyGroups, getReceivedInvitations, acceptInvitation, declineInvitation } from '../services/module4Api';
import SiteHeader from '../components/layout/SiteHeader';
import SiteFooter from '../components/layout/SiteFooter';

const Module4Page = () => {
  const [groups, setGroups] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (error) {
    console.error("Failed to parse user from localStorage");
    localStorage.removeItem('user');
  }
  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsRes, invRes] = await Promise.all([
        getMyGroups(),
        getReceivedInvitations()
      ]);
      setGroups(groupsRes.data.groups);
      setInvitations(invRes.data.invitations);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line
  }, []);

  const handleAcceptInvitation = async (invId) => {
    try {
      await acceptInvitation(invId);
      toast.success('Invitation accepted!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to accept');
    }
  };

  const handleDeclineInvitation = async (invId) => {
    try {
      await declineInvitation(invId);
      toast.success('Invitation declined');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to decline');
    }
  };

  const handleGroupCreated = (newGroup) => {
    setGroups(prev => [newGroup, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#FDFCF9]">
      <SiteHeader />
      <main className="flex-1">
        <div className="p-8 max-w-7xl mx-auto">
          {/* Pending Invitations Banner */}
          {invitations.length > 0 && (
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-5 mb-8 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Bell size={18} className="text-indigo-600" />
                <h3 className="font-bold text-indigo-800">
                  You have {invitations.length} pending invitation{invitations.length > 1 ? 's' : ''}
                </h3>
              </div>
              <div className="space-y-3">
                {invitations.map(inv => {
                  const isJoinRequest = inv.type === 'join_request';
                  const moduleConflict = isJoinRequest ? null : groups.find(g => g.moduleCode === inv.group?.moduleCode);
                  return (
                    <div key={inv._id} className={`rounded-lg p-4 flex items-center justify-between shadow-sm ${moduleConflict ? 'bg-orange-50 border border-orange-200' : isJoinRequest ? 'bg-blue-50 border border-blue-200' : 'bg-white'}`}>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{inv.group?.name}</p>
                        <p className="text-sm text-gray-500">
                          {inv.group?.moduleCode} • {isJoinRequest ? `Join request from ${inv.invitedBy?.name}` : `Invited by ${inv.invitedBy?.name}`}
                        </p>
                        {inv.message && <p className="text-sm text-gray-600 italic mt-1">"{inv.message}"</p>}
                        {moduleConflict && (
                          <p className="text-xs text-orange-700 font-semibold mt-1.5 flex items-center gap-1">
                            ⚠️ You're already in "{moduleConflict.name}" for {inv.group?.moduleCode}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {moduleConflict ? (
                          <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-bold">
                            Module Conflict
                          </span>
                        ) : (
                          <Button size="sm" onClick={() => handleAcceptInvitation(inv._id)}>{isJoinRequest ? 'Approve' : 'Accept'}</Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => handleDeclineInvitation(inv._id)}>Decline</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8 text-left">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Member Finder</h1>
              <p className="text-gray-500 mt-1">Manage your study groups and team members</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus size={18} className="mr-1" /> Create Group
              </Button>
            </div>
          </div>

          {/* Find Members Section */}
          <FindMembersSection groups={groups} />

          {/* My Groups */}
          <div className="text-left mb-4">
            <h2 className="text-xl font-bold text-gray-900">My Groups</h2>
            <p className="text-sm text-gray-500">Groups you've created or joined</p>
          </div>

          {/* Groups Grid */}
          {loading ? (
            <div className="text-center text-gray-400 py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-lg">Loading your groups...</p>
            </div>
          ) : groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map(group => (
                <GroupCard key={group._id} group={group} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-left">
                <Search size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No groups yet</h3>
              <p className="text-gray-500 mb-6">Create your first study group to get started!</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus size={18} className="mr-1" /> Create Your First Group
              </Button>
            </div>
          )}

          {/* Create Group Modal */}
          <CreateGroupModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreated={handleGroupCreated}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Module4Page;
