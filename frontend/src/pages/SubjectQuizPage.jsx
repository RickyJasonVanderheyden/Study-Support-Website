import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import SubjectSidebar from '../components/layout/SubjectSidebar';
import { getSubjectQuiz } from '../data/subjectQuizzes';

const SubjectQuizPage = () => {
  const { subjectKey } = useParams();
  const navigate = useNavigate();
  const subject = getSubjectQuiz(subjectKey);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const completedCount = Object.keys(answers).length;
  const score = useMemo(() => {
    if (!subject) return 0;
    return subject.questions.reduce((total, question, index) => total + (answers[index] === question.answer ? 1 : 0), 0);
  }, [answers, subject]);

  const saveSubjectAttempt = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('subjectQuizAttempts') || '[]');
      const nextAttempt = {
        id: `${subjectKey}-${Date.now()}`,
        subjectKey,
        subjectTitle: subject.title,
        score,
        totalQuestions: 10,
        percentage: Math.round((score / 10) * 100),
        completedAt: new Date().toISOString(),
      };
      localStorage.setItem('subjectQuizAttempts', JSON.stringify([nextAttempt, ...existing].slice(0, 20)));
    } catch (_error) {
      // Ignore storage issues; the quiz still completes.
    }
  };

  if (!subject) {
    return (
      <div className="min-h-screen bg-[#ECE7D6] text-[#1A2E23] flex items-center justify-center">
        <div className="rounded-2xl bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-semibold text-[#7A9080]">Subject not found.</p>
          <button onClick={() => navigate('/subject-categories')} className="mt-3 rounded-xl bg-[#E79A1A] px-4 py-2 text-[13px] font-semibold text-white">
            Back to categories
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    saveSubjectAttempt();
    toast.success(`Submitted: ${score}/10`);
    setTimeout(() => navigate('/dashboard'), 700);
  };

  return (
    <div className="min-h-screen bg-[#ECE7D6] text-[#1A2E23]">
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[210px_1fr]">
        <SubjectSidebar />

        <main className="px-3 py-4 sm:px-4 lg:px-6">
          <header className="mb-4 flex items-center justify-between rounded-2xl bg-[#E6E0CE] px-4 py-3">
            <h1 className="rounded-xl bg-[#D4DECA] px-4 py-2 text-[13px] font-semibold text-[#2C5A40]">Subject Questions</h1>
            <Bell className="h-4 w-4 text-[#A37F36]" />
          </header>

          <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-extrabold text-[#225A3E]">
                  {subject.title} - 10 MCQ Questions
                </h2>
                <p className="mt-2 text-[13px] leading-6 text-[#7A9080]">
                  Select one answer for each question and submit to see your score out of 10.
                </p>
                <p className="mt-3 inline-flex rounded-full bg-[#DDE7C7] px-3 py-1 text-[13px] font-medium text-[#2B5B3E]">
                  Completed: {completedCount} / 10
                </p>
              </div>
              <button onClick={() => navigate('/subject-categories')} className="rounded-xl bg-[#E79A1A] px-4 py-2 text-[13px] font-semibold text-white">
                Subject Categories
              </button>
            </div>
          </section>

          <section className="mt-4 space-y-4">
            {subject.questions.map((question, questionIndex) => (
              <article key={question.question} className="rounded-2xl border border-[#D6DED3] bg-white p-4 shadow-sm">
                <h3 className="text-[15px] font-semibold text-[#214A7A]">{question.question}</h3>
                <div className="mt-3 space-y-2">
                  {question.options.map((option, optionIndex) => {
                    const selected = answers[questionIndex] === optionIndex;
                    return (
                      <label
                        key={option}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[13px] transition ${
                          selected ? 'border-[#E79A1A] bg-[#FFF4E1]' : 'border-[#D6DED3] bg-[#F7F9F4] hover:bg-[#F1F5EC]'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`subject-question-${questionIndex}`}
                          checked={selected}
                          onChange={() => setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }))}
                        />
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>

          <section className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-[#1E5E3A] px-5 py-3 text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
            <button
              onClick={() => navigate('/subject-categories')}
              className="rounded-xl border border-[#D6DED3] bg-white px-5 py-3 text-[13px] font-semibold text-[#225A3E]"
            >
              Back to Categories
            </button>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SubjectQuizPage;
