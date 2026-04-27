import React from 'react';
import { cardBaseClass } from './theme';

const HeroSection = ({ title, subtitle, tabs = [], cta, stats = [], color = 'green', className = '' }) => {
  const toneClass =
    color === 'blue'
      ? 'bg-[#27588D] text-white border-[#2E5A86]'
      : 'bg-[#1F6B3A] text-white border-[#1F6B3A]';

  return (
    <section className={`${cardBaseClass} ${toneClass} p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black leading-tight">{title}</h2>
          <p className="mt-2 text-sm text-white/90">{subtitle}</p>
          {tabs.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={tab.onClick}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                    tab.active
                      ? 'border-white/30 bg-[#F2A112] text-white'
                      : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {cta}
      </div>
      {stats.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-white/20 p-4">
              <p className="text-4xl font-black">{stat.value}</p>
              <p className="mt-1 text-sm text-white/90">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
