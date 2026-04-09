import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import API from '../services/api';

const initialJoinForm = { studentName: '', studentEmail: '' };
const initialRatingForm = { studentName: '', studentEmail: '', rating: 5, comment: '' };

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');
const stars = (v) => `${'★'.repeat(Math.round(v || 0))}${'☆'.repeat(5 - Math.round(v || 0))}`;

const Module3SessionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sessionDetail, setSessionDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinForm, setJoinForm] = useState(initialJoinForm);
  const [ratingForm, setRatingForm] = useState(initialRatingForm);
  const [userRole, setUserRole] = useState('student');
  const [userEmail, setUserEmail] = useState('');

  const isSessionHost = useMemo(() => {
    if (!sessionDetail || !userEmail) return false;
    const hostMatch = sessionDetail.hostEmail?.toLowerCase() === userEmail;
    return hostMatch && ['session_lead', 'super_admin'].includes(userRole);
  }, [sessionDetail, userEmail, userRole]);

  const isSessionFull = useMemo(() => {
    if (!sessionDetail) return false;
    return sessionDetail.bookingCount >= sessionDetail.maxParticipants;
  }, [sessionDetail]);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/module3/sessions/${id}`);
      setSessionDetail(data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load session details');
      navigate('/module3');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return;
      const user = JSON.parse(raw);
      setUserRole(user?.role || 'student');
      setUserEmail(String(user?.email || '').toLowerCase());
      if (user?.name && user?.email) {
        setJoinForm({ studentName: user.name, studentEmail: user.email });
        setRatingForm((prev) => ({ ...prev, studentName: user.name, studentEmail: user.email }));
      }
    } catch (_error) {
      // ignore bad localStorage
    }
  }, []);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleJoinSession = async (event) => {
    event.preventDefault();
    try {
      await API.post('/module3/bookings', { sessionId: id, ...joinForm });
      toast.success('Session booked successfully!');
      fetchDetails();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to book session');
    }
  };

  const handleRateSession = async (event) => {
    event.preventDefault();
    try {
      await API.post('/module3/ratings', {
        sessionId: id,
        ...ratingForm,
        rating: Number(ratingForm.rating),
      });
      toast.success('Rating submitted');
      setRatingForm((prev) => ({ ...prev, rating: 5, comment: '' }));
      fetchDetails();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit rating');
    }
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Session link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF4ED] to-[#FDFCF9] p-4 md:p-8 text-slate-800 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl ${isSessionHost ? 'bg-gradient-to-br from-amber-500 to-[#276332]' : 'bg-[#276332]'}`}>
                {isSessionHost ? 'SL' : 'S'}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-[#276332] tracking-tight">{sessionDetail?.title || 'Session Details'}</h1>
                <p className="text-slate-600 font-medium text-sm md:text-base">
                  {isSessionHost ? 'Session Lead view — manage this kuppi, roster, and feedback' : 'Peer-to-peer study session details'}
                </p>
                {isSessionHost && (
                  <span className="inline-block mt-2 text-[10px] uppercase font-extrabold px-2 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                    You are the host
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {isSessionHost && sessionDetail && (
              <Button
                className="bg-[#276332] hover:bg-[#1e4a25] text-white border-none font-bold shadow-md px-6 py-3 rounded-lg transition-colors"
                onClick={() => navigate(`/module3?edit=${sessionDetail._id}`)}
              >
                Edit session
              </Button>
            )}
            <Button
              className="bg-slate-800 hover:bg-slate-900 text-white border-none font-bold shadow-md px-6 py-3 rounded-lg transition-colors flex items-center gap-2 w-full sm:w-auto"
              onClick={() => navigate('/module3')}
            >
              ← Back to sessions
            </Button>
          </div>
        </div>

        {loading || !sessionDetail ? (
          <Card className="bg-white text-slate-500 border border-emerald-100 shadow-sm text-center py-12">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#276332]"></div>
              <p className="font-medium text-lg">Loading session details...</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main Session Info */}
            <div className="xl:col-span-2 space-y-6">
              <Card className="bg-white text-slate-800 border border-emerald-100 shadow-sm rounded-xl p-6 space-y-6">
                {/* Session Status and Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm px-4 py-2 rounded-lg bg-[#FBF1E6] text-[#D97706] font-bold border border-[#F59E0B]/20 flex items-center gap-2">
                      📖 {sessionDetail.moduleCode} {sessionDetail.moduleName && `- ${sessionDetail.moduleName}`}
                    </span>
                    {sessionDetail.difficulty && sessionDetail.difficulty !== 'All Levels' && (
                      <span className={`text-sm px-4 py-2 rounded-lg font-bold border flex items-center gap-2 ${
                        sessionDetail.difficulty === 'Advanced' ? 'bg-red-50 text-red-600 border-red-200' :
                        sessionDetail.difficulty === 'Intermediate' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                        'bg-green-50 text-green-600 border-green-200'
                      }`}>
                        🎯 {sessionDetail.difficulty}
                      </span>
                    )}
                    {/* Session Status Badge */}
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold ${
                      isSessionFull ? 'bg-red-100 text-red-700 border border-red-200' :
                      new Date(sessionDetail.dateTime) < new Date() ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                      'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {isSessionFull ? '🔴 Full' : new Date(sessionDetail.dateTime) < new Date() ? '⚫ Completed' : '🟢 Available'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    ⭐ {sessionDetail.averageRating || 0} ({sessionDetail.ratingCount} reviews)
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-[#276332]">Session description</h2>
                  <p className="text-slate-700 leading-relaxed text-base bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {sessionDetail.description}
                  </p>
                </div>

                {/* Session Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#276332]">Session information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👨‍🏫</span>
                      <div>
                        <p className="font-bold text-slate-800">Host</p>
                        <p className="text-sm text-slate-600">{sessionDetail.hostName}</p>
                        <p className="text-xs text-slate-500">{sessionDetail.hostEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📅</span>
                      <div>
                        <p className="font-bold text-slate-800">Date & Time</p>
                        <p className="text-sm text-slate-600">{formatDateTime(sessionDetail.dateTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⏱️</span>
                      <div>
                        <p className="font-bold text-slate-800">Duration</p>
                        <p className="text-sm text-slate-600">{sessionDetail.durationMinutes} minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👥</span>
                      <div>
                        <p className="font-bold text-slate-800">Participants</p>
                        <p className="text-sm text-slate-600">{sessionDetail.bookingCount}/{sessionDetail.maxParticipants} joined</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#276332]">Session links</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      className="flex items-center gap-2 bg-[#276332] text-white px-4 py-3 rounded-lg hover:bg-[#1A4321] transition-colors font-bold text-center"
                      href={sessionDetail.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join meeting
                    </a>
                    <a
                      className="flex items-center gap-2 bg-slate-600 text-white px-4 py-3 rounded-lg hover:bg-slate-700 transition-colors font-bold text-center"
                      href={sessionDetail.materialsLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View materials
                    </a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-lg font-bold text-[#276332]">Quick actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white border-2 border-[#276332] text-[#276332] hover:bg-[#556B2F] hover:text-white hover:border-[#556B2F] font-bold shadow-sm px-4 py-2"
                      onClick={handleShareLink}
                    >
                      Share link
                    </Button>
                  </div>
                </div>

                {/* Host roster OR student book */}
                {isSessionHost && sessionDetail.bookings ? (
                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <div className="bg-gradient-to-r from-amber-600 to-[#276332] text-white p-4 rounded-lg">
                      <h3 className="text-xl font-bold">Participant roster</h3>
                      <p className="text-sm opacity-90 mt-1">Students who booked your session</p>
                    </div>
                    <div className="border border-amber-100 rounded-lg overflow-hidden bg-amber-50/40">
                      {sessionDetail.bookings.length === 0 ? (
                        <p className="p-6 text-slate-600 text-center font-medium">No bookings yet.</p>
                      ) : (
                        <ul className="divide-y divide-amber-100/80">
                          {sessionDetail.bookings.map((b) => (
                            <li key={b._id} className="p-4 bg-white/80 hover:bg-white transition-colors">
                              <p className="font-bold text-slate-900">{b.studentName}</p>
                              <p className="text-sm text-slate-600">{b.studentEmail}</p>
                              {b.studentMobile && (
                                <p className="text-xs text-slate-500 mt-1">Mobile: {b.studentMobile}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ) : (
                  userRole !== 'admin' && (
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                    <div className="bg-gradient-to-r from-[#276332] to-[#556B2F] text-white p-4 rounded-lg">
                        <h3 className="text-xl font-bold">
                          Book this session
                        </h3>
                        <p className="text-sm opacity-90 mt-1">Reserve your spot for this study session</p>
                      </div>
                      <form onSubmit={handleJoinSession} className="space-y-4 bg-white p-4 rounded-lg border border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                            <input
                              className="rounded-lg border-gray-200 bg-gray-50 text-slate-900 placeholder-gray-400 focus:border-[#276332] focus:ring-[#276332] w-full px-3 py-2"
                              placeholder="Enter your full name"
                              value={joinForm.studentName}
                              onChange={(e) => setJoinForm({ ...joinForm, studentName: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                            <input
                              className="rounded-lg border-gray-200 bg-gray-50 text-slate-900 placeholder-gray-400 focus:border-[#276332] focus:ring-[#276332] w-full px-3 py-2"
                              type="email"
                              placeholder="your.email@university.edu"
                              value={joinForm.studentEmail}
                              onChange={(e) => setJoinForm({ ...joinForm, studentEmail: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold w-full py-3 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSessionFull}
                        >
                          {isSessionFull ? 'Session full' : 'Book session'}
                        </Button>
                      </form>
                    </div>
                  )
                )}
              </Card>
            </div>

            {/* Ratings Sidebar */}
            <div className="space-y-6">
              <Card className="bg-white text-slate-800 border border-emerald-100 shadow-sm rounded-xl p-6">
                <div className="space-y-4">
                  <div className="text-center pb-4 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-[#276332] flex items-center justify-center gap-2">
                      {isSessionHost ? '⭐ Feedback on your session' : '⭐ Session Reviews'}
                    </h3>
                    <div className="mt-2">
                      <div className="text-3xl font-bold text-[#D97706]">{sessionDetail.averageRating || 0}</div>
                      <div className="text-sm text-slate-600">{sessionDetail.ratingCount} reviews</div>
                      <div className="text-lg mt-1">{stars(sessionDetail.averageRating)}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800">Recent Reviews</h4>
                    <div className="max-h-80 overflow-auto border border-slate-100 rounded-lg p-4 bg-gray-50 space-y-3">
                      {sessionDetail.ratings.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">📝</div>
                          <p className="text-sm text-slate-500 font-medium">No reviews yet</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {isSessionHost ? 'Share your session link so attendees can leave feedback.' : 'Be the first to leave a review!'}
                          </p>
                        </div>
                      ) : (
                        sessionDetail.ratings.map((item) => (
                          <div key={item._id} className="bg-white border border-gray-200 rounded-lg p-3 last:border-b-0">
                            <div className="flex items-center justify-between mb-2 gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800">{item.studentName}</p>
                                {isSessionHost && item.studentEmail && (
                                  <p className="text-xs text-slate-500 truncate" title={item.studentEmail}>
                                    {item.studentEmail}
                                  </p>
                                )}
                              </div>
                              <span className="text-sm font-bold text-[#D97706] bg-[#D97706]/10 px-2 py-1 rounded shrink-0">
                                {item.rating}/5 ⭐
                              </span>
                            </div>
                            {item.comment && (
                              <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed">
                                {item.comment}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Rating Form — students only */}
                  {!isSessionHost && userRole !== 'admin' && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white p-4 rounded-lg">
                        <h4 className="font-bold">Write a review</h4>
                        <p className="text-sm opacity-90 mt-1">Help others by sharing your experience</p>
                      </div>
                      <form onSubmit={handleRateSession} className="space-y-4 bg-white p-4 rounded-lg border border-slate-100">
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                            <input
                              className="rounded-lg border-gray-200 bg-gray-50 text-slate-900 placeholder-gray-400 focus:border-[#276332] focus:ring-[#276332] w-full px-3 py-2"
                              placeholder="Enter your name"
                              value={ratingForm.studentName}
                              onChange={(e) => setRatingForm({ ...ratingForm, studentName: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                            <input
                              className="rounded-lg border-gray-200 bg-gray-50 text-slate-900 placeholder-gray-400 focus:border-[#276332] focus:ring-[#276332] w-full px-3 py-2"
                              type="email"
                              placeholder="your.email@university.edu"
                              value={ratingForm.studentEmail}
                              onChange={(e) => setRatingForm({ ...ratingForm, studentEmail: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Rating</label>
                            <select
                              className="rounded-lg border-gray-200 bg-gray-50 text-slate-900 focus:border-[#276332] focus:ring-[#276332] w-full px-3 py-2"
                              value={ratingForm.rating}
                              onChange={(e) => setRatingForm({ ...ratingForm, rating: Number(e.target.value) })}
                            >
                              {[5, 4, 3, 2, 1].map((value) => (
                                <option key={value} value={value}>
                                  {value} Star{value !== 1 ? 's' : ''} {stars(value)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Review (Optional)</label>
                            <textarea
                              className="rounded-lg border-gray-200 bg-gray-50 text-slate-900 placeholder-gray-400 focus:border-[#276332] focus:ring-[#276332] w-full px-3 py-2"
                              rows={3}
                              placeholder="Share your experience with this session..."
                              value={ratingForm.comment}
                              onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="bg-[#276332] hover:bg-[#1A4321] text-white font-bold w-full py-3 shadow-sm"
                        >
                          Submit review
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Module3SessionDetailsPage;
