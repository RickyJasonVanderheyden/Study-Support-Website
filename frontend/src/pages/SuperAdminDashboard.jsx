import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../services/api';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const { data } = await API.get('/admin/requests');
      setRequests(data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch pending requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      const { data } = await API.patch('/admin/approve', { userId });
      toast.success(data.message);
      setRequests(requests.filter(req => req._id !== userId));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve');
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    try {
      const { data } = await API.patch('/admin/reject', { userId });
      toast.success(data.message);
      setRequests(requests.filter(req => req._id !== userId));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-slate-800 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[80px] opacity-20 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold font-mono text-white tracking-tight flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              SUPER ADMIN TERMINAL
            </h1>
            <p className="text-slate-400 mt-2 text-sm font-medium">Session Lead Access Requests Interface</p>
          </div>

          <div className="relative z-10 mt-6 md:mt-0 flex gap-4">
            <button 
              onClick={() => navigate('/module3')}
              className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-lg transition-colors border border-slate-600 shadow-sm"
            >
              System Modules
            </button>
          </div>
        </div>

        {/* Requests Dashboard */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden p-1">
          <div className="px-6 py-5 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/80">
            <h2 className="text-lg font-bold text-indigo-400 font-mono tracking-wide">PENDING REQUESTS QUEUE</h2>
            <div className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs font-bold text-slate-400">
              {requests.length} REQUEST{requests.length !== 1 ? 'S' : ''}
            </div>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-500 font-medium">Scanning database for requests...</div>
            ) : requests.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center">
                <svg className="w-16 h-16 text-slate-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-slate-400 mb-2">Queue is Empty</h3>
                <p className="text-slate-500 text-sm max-w-sm">There are no pending Session Lead requests at this time. All students are verified.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-bold">Registered User</th>
                      <th className="px-6 py-4 font-bold">Registration Number</th>
                      <th className="px-6 py-4 font-bold">Request Date</th>
                      <th className="px-6 py-4 text-right font-bold">Directive Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {requests.map((req) => (
                      <tr key={req._id} className="bg-slate-800 hover:bg-slate-700/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white text-base">{req.name}</div>
                          <div className="text-slate-400">{req.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg font-mono text-indigo-300">
                            {req.registrationNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                          <div className="text-xs text-slate-500 mt-1">{new Date(req.createdAt).toLocaleTimeString()}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3 opacity-90 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleReject(req._id)}
                              className="px-4 py-2 bg-slate-700 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 hover:border-rose-500/30 font-bold rounded-lg transition-all border border-slate-600 text-xs"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(req._id)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all text-xs flex items-center gap-2"
                            >
                              Approve Lead
                            </button>
                          </div>
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
