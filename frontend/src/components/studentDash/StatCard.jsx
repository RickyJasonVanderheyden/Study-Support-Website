import React from 'react';
import { cardBaseClass } from './theme';

const StatCard = ({ label, value, detail, tone = 'green' }) => {
  const valueClass = tone === 'orange' ? 'text-[#D98C00]' : tone === 'blue' ? 'text-[#27588D]' : 'text-[#1F6B3A]';
  return (
    <article className={`${cardBaseClass} p-4`}>
      <p className="text-xs font-bold uppercase tracking-widest text-[#7A837A]">{label}</p>
      <p className={`mt-2 text-4xl font-black ${valueClass}`}>{value}</p>
      {detail ? <p className="mt-1 text-sm text-[#7A837A]">{detail}</p> : null}
    </article>
  );
};

export default StatCard;
