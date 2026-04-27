import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Search, TrendingUp, Users } from 'lucide-react';
import SiteFooter from '../components/layout/SiteFooter';

const homepageImages = {
  // DrawKit-hosted assets (Grape + Watermelon animation collections)
  hero: 'https://cdn.prod.website-files.com/682d1c6b3c16bb956eafd6aa/682d1c6b3c16bb956eafdba3_3d-detail-grape-image.gif',
  platform: 'https://cdn.prod.website-files.com/682d1c6b3c16bb956eafd6aa/682d1c6b3c16bb956eafdbd9_grape-ani-cv.avif',
  collaboration: 'https://cdn.prod.website-files.com/682d1c6b3c16bb956eafd6aa/682d1c6b3c16bb956eafdbe0_water-melon-ani-cv.avif',
  module1: 'https://cdn.prod.website-files.com/682d1c6b3c16bb956eafd6aa/682d1c6b3c16bb956eafdbd3_grape-ani-tb.avif',
  module2: 'https://cdn.prod.website-files.com/682d1c6b3c16bb956eafd6aa/682d1c6b3c16bb956eafdbd9_grape-ani-cv-p-500.avif',
  module3: 'https://cdn.prod.website-files.com/682d1c6b3c16bb956eafd6aa/682d1c6b3c16bb956eafdbd6_watermelon--ani-tb.avif',
  module4: 'https://cdn.prod.website-files.com/682d1c6b3c16bb956eafd6aa/682d1c6b3c16bb956eafdbe0_water-melon-ani-cv-p-500.avif'
};

const featureCards = [
  {
    title: 'Progress Dashboard',
    desc: 'Track goals and progress in one place.',
    path: '/dashboard',
    icon: TrendingUp,
    tag: 'Module 1',
    preview: homepageImages.module1,
    accent: 'green'
  },
  {
    title: 'AI Study Tools',
    desc: 'Create quizzes, flashcards, and mind maps from notes.',
    path: '/module2',
    icon: BookOpen,
    tag: 'Module 2',
    preview: homepageImages.module2,
    accent: 'orange'
  },
  {
    title: 'Peer Sessions',
    desc: 'Plan and join focused sessions with classmates.',
    path: '/module3',
    icon: Users,
    tag: 'Module 3',
    preview: homepageImages.module3,
    accent: 'green'
  },
  {
    title: 'Member Finder',
    desc: 'Find teammates and build better study groups.',
    path: '/module4',
    icon: Search,
    tag: 'Module 4',
    preview: homepageImages.module4,
    accent: 'orange'
  }
];

const processSteps = [
  {
    title: 'Set Direction',
    desc: 'Start by defining your goals and tracking weekly progress in the dashboard.'
  },
  {
    title: 'Practice Smarter',
    desc: 'Use AI-powered learning tools to revise faster and retain more.'
  },
  {
    title: 'Collaborate Better',
    desc: 'Join peer sessions, form groups, and keep momentum with shared effort.'
  }
];

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      const timer = setTimeout(() => navigate('/login'), 600);
      return () => clearTimeout(timer);
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch {
      navigate('/login');
    }

    return undefined;
  }, [navigate]);

  useEffect(() => {
    if (!user) return undefined;

    const targets = document.querySelectorAll('[data-reveal]');
    if (!targets.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = Number(entry.target.getAttribute('data-reveal-delay') || 0);
            setTimeout(() => {
              entry.target.classList.add('ll-reveal-visible');
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F3F6F2] flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black text-[#1E4D35]">LearnLoop</h1>
          <p className="mt-4 text-[#3D5246] font-semibold">Loading homepage</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F6F2] text-[#1E2C24]">
      <style>{`
        .ll-reveal {
          opacity: 0;
          transform: translateY(14px);
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .ll-reveal.ll-reveal-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .ll-media-wrap {
          overflow: hidden;
        }
        .ll-media-pan {
          animation: ll-pan 14s ease-in-out infinite alternate;
          transform-origin: center;
          will-change: transform;
        }
        .ll-media-pan-soft {
          animation: ll-pan-soft 16s ease-in-out infinite alternate;
          transform-origin: center;
          will-change: transform;
        }
        .ll-media-float {
          animation: ll-float 5.6s ease-in-out infinite;
          will-change: transform;
        }
        @keyframes ll-pan {
          0% { transform: scale(1.03) translate3d(0, 0, 0); }
          50% { transform: scale(1.08) translate3d(-1.2%, -0.8%, 0); }
          100% { transform: scale(1.04) translate3d(1.2%, 0.6%, 0); }
        }
        @keyframes ll-pan-soft {
          0% { transform: scale(1.02) translate3d(0, 0, 0); }
          50% { transform: scale(1.06) translate3d(1%, -0.6%, 0); }
          100% { transform: scale(1.03) translate3d(-0.8%, 0.5%, 0); }
        }
        @keyframes ll-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
          100% { transform: translateY(0px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ll-media-pan,
          .ll-media-pan-soft,
          .ll-media-float {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <main className="flex-1">
        <section className="max-w-7xl mx-auto px-5 md:px-8 pt-8 md:pt-12 pb-6">
          <div data-reveal className="ll-reveal rounded-3xl border border-[#D8E8DC] bg-white p-7 md:p-10">
            <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 items-stretch">
              <div>
                <p className="inline-flex rounded-full border border-[#D8E8DC] bg-[#F6FBF7] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#276332]">
                  Study Support Website
                </p>
                <h1 className="mt-5 text-3xl md:text-5xl font-black leading-tight text-[#1E4D35]">
                  LearnLoop helps students learn with structure, clarity, and collaboration.
                </h1>
                <p className="mt-4 text-sm md:text-base leading-relaxed text-[#42584D] max-w-xl">
                  LearnLoop brings progress tracking, AI revision tools, peer sessions, and member discovery into one focused learning platform.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to="/module2"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#E8820C] px-5 py-3 text-sm font-bold text-white hover:bg-[#D97706] transition-colors"
                  >
                    Explore AI Tools
                    <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/module3"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#D8E8DC] bg-white px-5 py-3 text-sm font-bold text-[#1E4D35] hover:bg-[#F6FBF7] transition-colors"
                  >
                    View Peer Sessions
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="ll-media-wrap ll-media-float rounded-2xl border border-[#D8E8DC] bg-white p-3">
                <img
                  src={homepageImages.hero}
                  alt="LearnLoop collaboration preview"
                  className="ll-media-pan h-full min-h-[330px] w-full rounded-xl border border-[#DCE7DF] object-cover object-center"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 md:px-8 pb-6">
          <div data-reveal data-reveal-delay="40" className="ll-reveal rounded-3xl border border-[#E5E7EB] bg-[#FCFCFB] p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl md:text-2xl font-black text-[#1F2937]">What LearnLoop Offers</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-[#6B7280]">Core Features</p>
            </div>

            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featureCards.map((item, idx) => {
                const Icon = item.icon;
                const isOrange = item.accent === 'orange';
                return (
                  <Link
                    key={item.title}
                    to={item.path}
                    data-reveal
                    data-reveal-delay={String((idx + 1) * 60)}
                    className="ll-reveal rounded-2xl border border-[#E5E7EB] bg-white p-5 hover:shadow-sm transition-all"
                  >
                    <div className="ll-media-wrap mb-4 rounded-xl border border-[#E5E7EB]">
                      <img
                        src={item.preview}
                        alt={`${item.title} preview`}
                        className="ll-media-pan-soft aspect-[16/10] w-full bg-[#F8FAF9] object-contain object-center"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          isOrange ? 'bg-[#FFF3E6] text-[#B45309]' : 'bg-[#ECF7EF] text-[#1E4D35]'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                          isOrange
                            ? 'border-[#F6D8B8] bg-[#FFF7ED] text-[#9A3412]'
                            : 'border-[#CDE8D4] bg-[#F2FAF4] text-[#1E4D35]'
                        }`}
                      >
                        {item.tag}
                      </span>
                    </div>
                    <h3 className="mt-4 text-base font-black text-[#111827]">{item.title}</h3>
                    <p className="mt-2 text-sm text-[#4B5563] min-h-[44px]">{item.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#1F2937]">
                      View Module
                      <ArrowRight size={14} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 md:px-8 pb-6">
          <div className="grid lg:grid-cols-2 gap-5">
            <div data-reveal data-reveal-delay="70" className="ll-reveal rounded-3xl border border-[#D8E8DC] bg-white p-6">
              <h3 className="text-lg font-black text-[#1E4D35]">Platform Snapshot</h3>
              <p className="mt-2 text-sm text-[#4E6157] leading-relaxed">
                LearnLoop combines administrative visibility and student-friendly workflows. The interface stays simple while handling multiple learning needs.
              </p>
              <div className="ll-media-wrap mt-4 rounded-2xl border border-[#DCE7DF]">
                <img
                  src={homepageImages.platform}
                  alt="LearnLoop dashboard preview"
                  className="ll-media-pan-soft aspect-[16/10] w-full bg-[#F8FAF9] object-contain object-center"
                />
              </div>
            </div>

            <div data-reveal data-reveal-delay="100" className="ll-reveal rounded-3xl border border-[#D8E8DC] bg-white p-6">
              <h3 className="text-lg font-black text-[#1E4D35]">Collaboration In Action</h3>
              <p className="mt-2 text-sm text-[#4E6157] leading-relaxed">
                Students can coordinate sessions, improve accountability, and build subject-focused communities through the peer module.
              </p>
              <div className="ll-media-wrap mt-4 rounded-2xl border border-[#DCE7DF]">
                <img
                  src={homepageImages.collaboration}
                  alt="Peer study session feature preview"
                  className="ll-media-pan aspect-[16/10] w-full bg-[#F8FAF9] object-contain object-center"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 md:px-8 pb-6">
          <div data-reveal data-reveal-delay="120" className="ll-reveal rounded-3xl border border-[#D8E8DC] bg-white p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl md:text-2xl font-black text-[#1E4D35]">How Students Use It</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-[#6C7A72]">Simple Workflow</p>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {processSteps.map((step, idx) => (
                <div key={step.title} className="rounded-2xl border border-[#E3ECE6] bg-[#FAFCFA] p-5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[#688074]">Step {idx + 1}</p>
                  <h3 className="mt-2 text-lg font-black text-[#1E4D35]">{step.title}</h3>
                  <p className="mt-2 text-sm text-[#4B5F54]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 md:px-8 pb-12">
          <div data-reveal data-reveal-delay="140" className="ll-reveal rounded-3xl border border-[#D8E8DC] bg-white p-7 md:p-9 text-center">
            <h2 className="text-2xl md:text-3xl font-black text-[#1E4D35]">Built For Academic Growth</h2>
            <p className="mt-3 max-w-3xl mx-auto text-sm md:text-base text-[#4E6157] leading-relaxed">
              LearnLoop gives students and learning teams a practical digital environment for consistent study progress,
              stronger collaboration, and smarter revision.
            </p>
            <div className="mt-6 flex justify-center flex-wrap gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E4D35] px-5 py-3 text-sm font-bold text-white hover:bg-[#173f2d] transition-colors"
              >
                Start With Dashboard
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-[#D8E8DC] bg-white px-5 py-3 text-sm font-bold text-[#1E4D35] hover:bg-[#F6FBF7] transition-colors"
              >
                View My Profile
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Home;
