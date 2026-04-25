import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import SubjectSidebar from '../components/layout/SubjectSidebar';
import { SUBJECT_ORDER, getSubjectQuiz } from '../data/subjectQuizzes';

const SubjectCategoriesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#ECE7D6] text-[#1A2E23]">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[210px_1fr]">
        <SubjectSidebar />

        <main className="px-3 py-4 sm:px-4 lg:px-6">
          <header className="mb-4 flex items-center justify-between rounded-2xl bg-[#E6E0CE] px-4 py-3">
            <h1 className="rounded-xl bg-[#D4DECA] px-4 py-2 text-[13px] font-semibold text-[#2C5A40]">Subject Categories</h1>
            <Bell className="h-4 w-4 text-[#A37F36]" />
          </header>

          <section className="rounded-2xl bg-white px-4 py-5 shadow-sm sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-extrabold text-[#225A3E]">Select Your Subject Category</h2>
                <p className="mt-2 text-[13px] leading-6 text-[#7A9080]">
                  Choose a subject window to continue. You will be taken to a dedicated question page with 10 subject questions.
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-xl bg-[#E79A1A] px-4 py-2 text-[13px] font-semibold text-white"
              >
                Open Dashboard
              </button>
            </div>
          </section>

          <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SUBJECT_ORDER.map((subjectKey) => {
              const subject = getSubjectQuiz(subjectKey);
              return (
                <article key={subjectKey} className="rounded-2xl border border-[#D6DED3] bg-white p-4 shadow-sm">
                  <h3 className="text-[17px] font-extrabold text-[#225A3E]">{subject.title}</h3>
                  <p className="mt-3 text-[13px] leading-6 text-[#7A9080]">{subject.subtitle}</p>
                  <button
                    onClick={() => navigate(`/subject-quiz/${subjectKey}`)}
                    className="mt-5 w-full rounded-xl bg-[#E79A1A] px-4 py-2.5 text-[13px] font-semibold text-white"
                  >
                    Start Questions
                  </button>
                </article>
              );
            })}
          </section>
        </main>
      </div>
    </div>
  );
};

export default SubjectCategoriesPage;
