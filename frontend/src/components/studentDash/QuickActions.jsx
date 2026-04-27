import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cardBaseClass } from './theme';

const QuickActions = ({ items = [] }) => {
  const navigate = useNavigate();
  return (
    <section className={`${cardBaseClass} p-5`}>
      <h3 className="text-4xl font-black text-[#173B2F]">Quick Actions</h3>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => navigate(item.to)}
            className={`w-full rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
              item.primary
                ? 'border-transparent bg-[#F2A112] text-white hover:bg-[#D98C00]'
                : 'border-[#DDE5D8] bg-white text-[#1F6B3A] hover:bg-[#EEF6EA]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
};

export default QuickActions;
