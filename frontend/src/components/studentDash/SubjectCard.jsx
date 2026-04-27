import React from 'react';

const SubjectCard = ({ title, description, onStart }) => {
  return (
    <article className="rounded-3xl border border-[#DDE5D8] bg-white p-5 shadow-sm shadow-black/5">
      <h4 className="text-3xl font-black text-[#173B2F]">{title}</h4>
      <p className="mt-2 text-sm text-[#7A837A]">{description}</p>
      <button
        type="button"
        onClick={onStart}
        className="mt-5 w-full rounded-xl bg-[#F2A112] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#D98C00]"
      >
        Start Questions
      </button>
    </article>
  );
};

export default SubjectCard;
