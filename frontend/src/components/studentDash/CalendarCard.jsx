import React from 'react';
import { CalendarDays } from 'lucide-react';
import { cardBaseClass } from './theme';

const CalendarCard = ({ date = new Date() }) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = date.getDate();
  const firstDayOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <section className={`${cardBaseClass} p-5`}>
      <div className="flex items-center justify-between">
        <h3 className="text-4xl font-black text-[#173B2F]">
          {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <CalendarDays className="text-[#7A837A]" size={20} />
      </div>
      <div className="mt-4 grid grid-cols-7 gap-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <span key={`${day}-${idx}`} className="text-center text-xs font-bold text-[#7A837A]">
            {day}
          </span>
        ))}
        {Array.from({ length: firstDayOffset }).map((_, idx) => (
          <span key={`empty-${idx}`} className="h-8" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const day = idx + 1;
          const todayClass = day === today ? 'border-[#D98C00] bg-white text-[#173B2F]' : 'border-transparent bg-[#F3F6F9] text-[#6C7A7A]';
          return (
            <span
              key={day}
              className={`flex h-8 items-center justify-center rounded-xl border text-sm font-medium ${todayClass}`}
            >
              {day}
            </span>
          );
        })}
      </div>
    </section>
  );
};

export default CalendarCard;
