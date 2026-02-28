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
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Your Progress</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-primary-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <span className="text-sm text-primary-600 font-medium">Quizzes</span>
          </div>
          <p className="text-2xl font-bold text-primary-700">{progress.totalQuizzes}</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">Attempts</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{progress.totalAttempts}</p>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-600 font-medium">Avg Score</span>
          </div>
          <p className="text-2xl font-bold text-yellow-700">{progress.averageScore}%</p>
        </div>
        
        <div className="p-4 bg-orange-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-orange-600 font-medium">Streak</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{progress.streak} days</p>
        </div>
      </div>

      {/* Subject Performance */}
      {progress.subjectPerformance && progress.subjectPerformance.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Performance by Subject</h3>
          <div className="space-y-3">
            {progress.subjectPerformance.slice(0, 5).map((subject, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="w-24 text-sm text-gray-600 truncate">{subject.subject}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary-600 h-full rounded-full transition-all"
                    style={{ width: `${subject.averageScore}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-12 text-right">
                  {subject.averageScore}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {progress.recentActivity && progress.recentActivity.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {progress.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700 truncate flex-1">{activity.quizTitle}</span>
                <span className={`text-sm font-medium px-2 py-1 rounded
                  ${activity.score >= 60 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                >
                  {activity.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressStats;
