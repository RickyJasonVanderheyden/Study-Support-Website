import React from 'react';
import TopBar from './TopBar';

const ActionButton = ({ label, tone = 'green', onClick }) => {
  const cls =
    tone === 'orange'
      ? 'bg-[#F2A112] hover:bg-[#D98C00] text-white'
      : 'bg-[#5F8F66] hover:bg-[#4E7B56] text-white';
  return (
    <button type="button" onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${cls}`}>
      {label}
    </button>
  );
};

const PageShell = ({ breadcrumb, children, showPeerAndQuiz = false, onPeerClick, onQuizClick }) => {
  return (
    <div className="min-h-screen bg-[#EFE8D6] px-4 py-6 md:px-7">
      <div className="mx-auto max-w-[1280px] space-y-5">
        <TopBar
          breadcrumb={breadcrumb}
          actions={
            showPeerAndQuiz ? (
              <>
                <ActionButton label="Peer to Peer Session" tone="green" onClick={onPeerClick} />
                <ActionButton label="Quiz Builder" tone="orange" onClick={onQuizClick} />
              </>
            ) : null
          }
        />
        {children}
      </div>
    </div>
  );
};

export default PageShell;
