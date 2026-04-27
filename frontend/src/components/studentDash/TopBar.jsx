import React from 'react';
import { Bell } from 'lucide-react';
import { cardBaseClass } from './theme';

const TopBar = ({ breadcrumb, actions }) => {
  return (
    <div className={`${cardBaseClass} flex items-center justify-between px-5 py-3 bg-[#F6F1E4]`}>
      <span className="rounded-xl bg-[#EAF1EA] px-4 py-2 text-sm font-bold text-[#1F6B3A]">{breadcrumb}</span>
      <div className="flex items-center gap-2">
        {actions}
        <button
          type="button"
          className="rounded-xl border border-[#DDE5D8] bg-white p-2 text-[#7A837A] hover:text-[#173B2F]"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
