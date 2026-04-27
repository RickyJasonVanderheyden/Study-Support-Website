import React from 'react';
import { cardBaseClass } from './theme';

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ActivityChart = ({ points = [] }) => {
  const normalized = weekDays.map((day) => {
    const found = points.find((point) => point.day === day);
    return found ? Number(found.percentage || 0) : 0;
  });

  const max = Math.max(10, ...normalized);
  const polylinePoints = normalized
    .map((value, index) => {
      const x = (index / (normalized.length - 1)) * 100;
      const y = 85 - Math.round((value / max) * 60);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <section className={`${cardBaseClass} p-5`}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-4xl font-black text-[#173B2F]">My Activity</h3>
        <span className="text-sm font-semibold text-[#7A837A]">This Week</span>
      </div>
      <div className="rounded-2xl bg-[#F1F5EF] p-4">
        <svg viewBox="0 0 100 90" className="h-36 w-full">
          <polyline fill="none" stroke="#1F6B3A" strokeWidth="2.8" points={polylinePoints} />
        </svg>
        <div className="mt-2 grid grid-cols-7 text-center text-sm text-[#7A837A]">
          {weekDays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ActivityChart;
