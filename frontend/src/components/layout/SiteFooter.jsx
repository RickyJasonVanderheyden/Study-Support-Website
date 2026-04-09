import React from 'react';
import { BookOpen, Mail, MapPin, Phone } from 'lucide-react';

const SiteFooter = () => {
  return (
    <footer className="border-t border-[#D8E8DC] bg-[#173e1f] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8820C] text-white shadow-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#D6ECD8]">LearnLoop</p>
              <h2 className="text-lg font-bold">Study Support Website</h2>
            </div>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#D6ECD8]">
            A student-first learning space for AI study tools, peer sessions, progress tracking, and member collaboration.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-[#F7F4EE]">Quick Contact</h3>
          <div className="space-y-3 text-sm text-[#D6ECD8]">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#E8820C]" />
              <span>support@learnloop.local</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#E8820C]" />
              <span>+94 11 000 0000</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-[#E8820C]" />
              <span>Student Learning Hub</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.24em] text-[#F7F4EE]">Built For Students</h3>
          <p className="text-sm leading-6 text-[#D6ECD8]">
            Study smarter with a calm interface, focused tools, and a personal profile that keeps your progress organized.
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#F7F4EE]">
            AI tools, peer sessions, member search, dashboard insights, and personal study history in one place.
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-[#C2E0C6]">
        © {new Date().getFullYear()} LearnLoop. All rights reserved.
      </div>
    </footer>
  );
};

export default SiteFooter;
