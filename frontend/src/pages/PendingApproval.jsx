import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../services/api';

const PendingApproval = () => {
  const navigate = useNavigate();
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setCheckingStatus(true);
    try {
      const { data } = await API.get('/admin/check-status');

      if (data.canLogin) {
        if (data.role === 'session_lead') {
          toast.success('Your Session Lead request has been approved! Welcome aboard!');
          navigate('/module3');
        } else if (data.role === 'super_admin') {
          navigate('/super-admin-dashboard');
        } else {
          navigate('/module3');
        }
      } else if (data.roleRequest === 'rejected') {
        toast.error('Your Session Lead request was rejected. Contact admin for more information.');
        navigate('/login');
      }
      // If still pending, stay on this page
    } catch (error) {
      console.error('Failed to check status:', error);
      // Stay on page if check fails
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleGoBack = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex font-sans bg-gradient-to-br from-[#EAF4ED] to-[#FDFCF9]">
      {/* Main Content */}
      <div className="w-full flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-2xl bg-white border border-emerald-100 shadow-2xl rounded-3xl p-12 relative overflow-hidden">

          {/* Decorative flair */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#276332] via-[#556B2F] to-[#F59E0B]"></div>

          {/* Animated Background Elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-[#276332] rounded-full mix-blend-multiply filter blur-2xl opacity-5 animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-[#F59E0B] rounded-full mix-blend-multiply filter blur-2xl opacity-5 animate-pulse" style={{ animationDelay: '2s' }}></div>

          <div className="relative z-10 text-center space-y-8">

            {/* Status Icon */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-[#276332] tracking-tight">
                Request Pending Approval
              </h1>
              <p className="text-xl text-slate-600 font-medium max-w-lg mx-auto leading-relaxed">
                Your Session Lead application has been submitted successfully and is currently under review by our Super Admin.
              </p>
            </div>

            {/* Status Details */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-amber-800 font-semibold">Processing your request...</span>
              </div>

              <div className="text-sm text-amber-700 space-y-2">
                <p>• Your application will be reviewed within 24-48 hours</p>
                <p>• You will receive an email notification once a decision is made</p>
                <p>• Please check your email regularly for updates</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button
                onClick={checkStatus}
                disabled={checkingStatus}
                className="px-6 py-3 bg-[#276332] hover:bg-[#1e4a25] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {checkingStatus ? 'Checking...' : 'Check Status'}
              </button>
              <button
                onClick={handleGoBack}
                className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Go Back
              </button>
            </div>

            {/* Contact Info */}
            <div className="pt-6 border-t border-slate-200">
              <p className="text-sm text-slate-500">
                Need help? Contact our support team at{' '}
                <a href="mailto:support@learnloop.com" className="text-[#276332] hover:underline font-medium">
                  support@learnloop.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;