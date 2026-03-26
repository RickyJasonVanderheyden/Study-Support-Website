import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Flame, BookOpen, RefreshCw } from 'lucide-react';
import API from '../../services/api';

const ProgressStats = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      const response = await API.get('/module2/progress');
      setProgress(response.data.progress);
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Don't show error toast for initial load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-indigo-100 p-8">
        <div className="flex flex-col items-center justify-center py-10 gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin" />
          <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Analyzing Data...</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-100 p-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-indigo-500" />
            Performance Metrics
          </h2>
          <button 
            onClick={fetchProgress}
            className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 group hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Quizzes</span>
            </div>
            <p className="text-3xl font-black text-indigo-700">{progress.totalQuizzes}</p>
          </div>
          
          <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 group hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <Target className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Attempts</span>
            </div>
            <p className="text-3xl font-black text-emerald-700">{progress.totalAttempts}</p>
          </div>
          
          <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 group hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Avg Score</span>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-black text-purple-700">{progress.averageScore}</p>
              <span className="text-sm font-bold text-purple-400">%</span>
            </div>
          </div>
          
          <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 group hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-white rounded-lg shadow-sm">
                <Flame className="w-4 h-4 text-rose-600" />
              </div>
              <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Streak</span>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-black text-rose-700">{progress.streak}</p>
              <span className="text-sm font-bold text-rose-400">days</span>
            </div>
          </div>
        </div>

        {/* Subject Performance */}
        {progress.subjectPerformance && progress.subjectPerformance.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-5">Performance by Subject</h3>
            <div className="space-y-4">
              {progress.subjectPerformance.slice(0, 5).map((subject, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-28 text-sm font-bold text-gray-700 truncate">{subject.subject}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-1000 shadow-sm"
                      style={{ width: subject.averageScore + '%' }}
                    />
                  </div>
                  <span className="text-sm font-black text-indigo-600 w-12 text-right tabular-nums">
                    {subject.averageScore}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {progress.recentActivity && progress.recentActivity.length > 0 && (
          <div className="mt-8 pt-8 border-t border-slate-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Recent Milestones</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {progress.recentActivity.slice(0, 4).map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all cursor-default">
                  <span className="text-sm font-bold text-gray-700 truncate flex-1 pr-3">{activity.quizTitle}</span>
                  <div className={`px-3 py-1 rounded-lg text-xs font-black border ${
                    activity.score >= 80 
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                      : activity.score >= 60 
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {activity.score}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressStats;
