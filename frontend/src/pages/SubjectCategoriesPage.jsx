import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/studentDash/PageShell';
import SubjectCard from '../components/studentDash/SubjectCard';
import { getSubjects } from '../services/studentDashboardApi';

const SubjectCategoriesPage = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getSubjects();
        if (mounted) setSubjects(data || []);
      } catch {
        if (mounted) setSubjects([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PageShell breadcrumb="Subject Categories">
      <section className="rounded-2xl border border-[#DDE5D8] bg-white p-6 shadow-sm shadow-black/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black text-[#173B2F]">Select Your Subject Category</h2>
            <p className="mt-2 text-sm text-[#7A837A]">
              Choose a subject window to continue. You will be taken to a dedicated question page with 10 subject
              questions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-xl bg-[#F2A112] px-5 py-3 text-sm font-bold text-white hover:bg-[#D98C00]"
          >
            Open Dashboard
          </button>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-[#DDE5D8] bg-white p-6 text-sm text-[#7A837A]">Loading subjects...</div>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.slug}
              title={subject.name}
              description={subject.description}
              onStart={() => navigate(`/subject-quiz/${subject.slug}`)}
            />
          ))}
        </section>
      )}
    </PageShell>
  );
};

export default SubjectCategoriesPage;
