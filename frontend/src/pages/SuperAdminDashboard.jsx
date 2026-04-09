import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../services/api';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending | approved | rejected

  useEffect(() => {
    // Check if super admin
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      navigate('/boss-admin-login');
      return;
    }
    const user = JSON.parse(rawUser);
    if (user.role !== 'super_admin') {
      toast.error('Unauthorized access');
      navigate('/');
      return;
    }

    fetchRequests();
  }, [navigate]);

  const fetchRequests = async () => {
    try {
      const [{ data: pending }, { data: approved }, { data: rejected }] = await Promise.all([
        API.get('/admin/requests'),
        API.get('/admin/approved'),
        API.get('/admin/rejected'),
      ]);
      setPendingRequests(pending);
      setApprovedRequests(approved);
      setRejectedRequests(rejected);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const { data } = await API.patch('/admin/approve', { userId });
      toast.success(data.message);
      setPendingRequests((prev) => prev.filter((req) => req._id !== userId));
      if (data.user) setApprovedRequests((prev) => [data.user, ...prev]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      const { data } = await API.patch('/admin/reject', { userId });
      toast.success(data.message);
      setPendingRequests((prev) => prev.filter((req) => req._id !== userId));
      // We don't get the full user payload here; refresh the rejected list.
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject');
    }
  };

  const rows = activeTab === 'pending'
    ? pendingRequests
    : activeTab === 'approved'
      ? approvedRequests
      : rejectedRequests;

  const headerLabel = activeTab === 'pending'
    ? 'PENDING REQUESTS QUEUE'
    : activeTab === 'approved'
      ? 'APPROVED REQUESTS ARCHIVE'
      : 'REJECTED REQUESTS ARCHIVE';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071A0E] via-[#0B2314] to-[#0A1B12] text-slate-100 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-[#0D2A1A]/70 backdrop-blur-xl rounded-2xl border border-emerald-900/40 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-20 -right-10 w-72 h-72 bg-emerald-500/25 rounded-full filter blur-[90px] opacity-50 pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-10 w-72 h-72 bg-amber-400/20 rounded-full filter blur-[90px] opacity-50 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#F59E0B] animate-pulse"></span>
              Super Admin
            </h1>
            <p className="text-emerald-100/70 mt-2 text-sm font-semibold">Session Lead requests</p>
          </div>

          <div className="relative z-10 mt-6 md:mt-0 flex gap-4">
            <button 
              onClick={() => navigate('/module3')}
              className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white text-sm font-bold rounded-lg transition-colors border border-white/15 shadow-md"
            >
              System Modules
            </button>
          </div>
        </div>

        {/* Requests Dashboard */}
        <div className="bg-[#0D2A1A]/60 backdrop-blur-xl rounded-2xl border border-emerald-900/35 shadow-2xl overflow-hidden p-1">
          <div className="px-6 py-5 border-b border-emerald-900/30 flex justify-between items-center bg-[#0B2314]/60">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-extrabold text-emerald-200 tracking-wide">{headerLabel}</h2>
              <div className="flex bg-black/20 border border-white/10 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('pending')}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-colors ${
                    activeTab === 'pending' ? 'bg-[#276332] text-white' : 'text-emerald-100/70 hover:text-white'
                  }`}
                >
                  Pending ({pendingRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('approved')}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-colors ${
                    activeTab === 'approved' ? 'bg-[#F59E0B] text-[#071A0E]' : 'text-emerald-100/70 hover:text-white'
                  }`}
                >
                  Approved ({approvedRequests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('rejected')}
                  className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-colors ${
                    activeTab === 'rejected' ? 'bg-red-600 text-white' : 'text-emerald-100/70 hover:text-white'
                  }`}
                >
                  Rejected ({rejectedRequests.length})
                </button>
              </div>
            </div>
            <div className="px-3 py-1 bg-black/20 border border-white/10 rounded-full text-xs font-extrabold text-emerald-100/70">
              {rows.length} REQUEST{rows.length !== 1 ? 'S' : ''}
            </div>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-12 text-center text-emerald-100/60 font-semibold">Loading requests...</div>
            ) : rows.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <svg className="w-16 h-16 text-emerald-900/60 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-extrabold text-emerald-100/80 mb-2">Nothing here</h3>
                <p className="text-emerald-100/60 text-sm max-w-sm font-medium">
                  {activeTab === 'pending'
                    ? 'There are no pending Session Lead requests at this time.'
                    : activeTab === 'approved'
                      ? 'No approved requests yet.'
                      : 'No rejected requests yet.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-emerald-100/70 uppercase bg-black/20 tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-bold">Registered User</th>
                      <th className="px-6 py-4 font-bold">Registration Number</th>
                      <th className="px-6 py-4 font-bold">Request Date</th>
                      <th className="px-6 py-4 text-right font-bold">
                        {activeTab === 'pending' ? 'Directive Actions' : 'Status'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/25">
                    {rows.map((req) => (
                      <tr key={req._id} className="bg-transparent hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white text-base">{req.name}</div>
                          <div className="text-emerald-100/60">{req.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-black/20 border border-white/10 rounded-lg font-mono text-amber-200">
                            {req.registrationNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-emerald-100/60">
                          {new Date(req.createdAt).toLocaleDateString()}
                          <div className="text-xs text-emerald-100/40 mt-1">{new Date(req.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {activeTab === 'pending' ? (
                            <div className="flex justify-end gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleReject(req._id)}
                                className="px-4 py-2 bg-white/10 hover:bg-red-500/15 text-emerald-100/80 hover:text-red-200 hover:border-red-400/30 font-extrabold rounded-lg transition-all border border-white/10 text-xs"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleApprove(req._id)}
                                className="px-4 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#071A0E] font-extrabold rounded-lg shadow-lg shadow-amber-500/15 transition-all text-xs flex items-center gap-2"
                              >
                                Approve Lead
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`inline-flex items-center justify-center px-3 py-1.5 rounded-full text-xs font-extrabold border ${
                                activeTab === 'approved'
                                  ? 'bg-amber-500/15 text-amber-200 border-amber-400/30'
                                  : 'bg-red-500/15 text-red-200 border-red-400/30'
                              }`}
                            >
                              {activeTab === 'approved' ? 'APPROVED' : 'REJECTED'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
