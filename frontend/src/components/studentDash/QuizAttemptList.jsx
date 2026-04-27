import React from 'react';
import { cardBaseClass } from './theme';

const QuizAttemptList = ({ title, subtitle, items = [] }) => {
  return (
    <section className={`${cardBaseClass} p-5`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-4xl font-black text-[#173B2F]">{title}</h3>
        <span className="text-sm font-semibold text-[#7A837A]">{subtitle}</span>
      </div>
      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id || `${item.subjectName}-${item.completedAt}`} className="rounded-xl border border-[#DDE5D8] bg-[#F5F9F3] px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[#173B2F]">{item.subjectName}</p>
                  <p className="text-sm text-[#7A837A]">
                    Completed: {item.completedAt ? new Date(item.completedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-[#173B2F]">
                    {item.score}/{item.totalQuestions}
                  </p>
                  <p className="text-sm font-semibold text-[#7A837A]">{item.percentage}%</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-[#DDE5D8] p-4 text-sm text-[#7A837A]">
            No quiz attempts submitted yet.
          </p>
        )}
      </div>
    </section>
  );
};

export default QuizAttemptList;
