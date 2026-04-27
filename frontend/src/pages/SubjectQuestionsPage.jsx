import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/studentDash/PageShell';
import QuizQuestionCard from '../components/studentDash/QuizQuestionCard';
import { getQuizByCategory, submitQuiz } from '../services/studentDashboardApi';

const SubjectQuestionsPage = () => {
  const navigate = useNavigate();
  const { categorySlug } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [startedAt, setStartedAt] = useState(Date.now());

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getQuizByCategory(categorySlug);
        if (mounted) setQuiz(data);
      } catch {
        if (mounted) setError('Unable to load quiz questions.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [categorySlug]);

  const completed = Object.keys(answers).length;
  const total = quiz?.questions?.length || 10;
  const isComplete = completed === total;

  const orderedAnswers = useMemo(() => {
    if (!quiz?.questions) return [];
    return quiz.questions.map((_, index) => {
      return Number.isInteger(answers[index]) ? answers[index] : -1;
    });
  }, [answers, quiz]);

  const onSubmit = async () => {
    if (!isComplete || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const timeTaken = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      await submitQuiz(categorySlug, orderedAnswers, timeTaken);
      navigate('/dashboard');
    } catch (e) {
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell breadcrumb="Subject Questions">
        <div className="rounded-2xl border border-[#DDE5D8] bg-white p-6 text-sm text-[#7A837A]">Loading quiz...</div>
      </PageShell>
    );
  }

  if (!quiz) {
    return (
      <PageShell breadcrumb="Subject Questions">
        <div className="rounded-2xl border border-[#DDE5D8] bg-white p-6 text-sm text-red-600">{error || 'Quiz not found.'}</div>
      </PageShell>
    );
  }

  return (
    <PageShell breadcrumb="Subject Questions">
      <section className="rounded-2xl border border-[#DDE5D8] bg-white p-6 shadow-sm shadow-black/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black text-[#173B2F]">
              {quiz.name} - {quiz.questions.length} MCQ Questions
            </h2>
            <p className="mt-2 text-sm text-[#7A837A]">
              Select one answer for each question and submit to see your score out of 10.
            </p>
            <span className="mt-3 inline-flex rounded-xl bg-[#EAF1EA] px-4 py-2 text-sm font-bold text-[#173B2F]">
              Completed: {completed} / {total}
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/subject-categories')}
            className="rounded-xl bg-[#F2A112] px-4 py-3 text-sm font-bold text-white hover:bg-[#D98C00]"
          >
            Subject Categories
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {quiz.questions.map((question, index) => (
          <QuizQuestionCard
            key={question.id}
            question={question}
            index={index}
            selectedAnswer={answers[index]}
            onSelect={(selected) => setAnswers((prev) => ({ ...prev, [index]: selected }))}
          />
        ))}
      </section>

      <section className="rounded-2xl border border-[#DDE5D8] bg-white p-6 shadow-sm shadow-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#7A837A]">Please complete all questions before submitting.</p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!isComplete || submitting}
            className="rounded-xl bg-[#F2A112] px-6 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-[#D98C00]"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm font-semibold text-red-600">{error}</p> : null}
      </section>
    </PageShell>
  );
};

export default SubjectQuestionsPage;
