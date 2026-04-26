import { Link } from 'react-router-dom'
import { subjectCategories } from '../data/subjectQuestions'

function SubjectCategoriesPage() {
  return (
    <div className="subjects-page">
      <section className="card subjects-hero">
        <div className="card-header">
          <h3>Select Your Subject Category</h3>
          <Link to="/dashboard" className="inline-nav-link">
            Open Dashboard
          </Link>
        </div>
        <p className="section-intro">
          Choose a subject window to continue. You will be taken to a dedicated question page with 10 subject
          questions.
        </p>
      </section>

      <section className="subjects-grid">
        {subjectCategories.map((subject) => (
          <article key={subject.slug} className="card subject-window">
            <h4>{subject.name}</h4>
            <p>{subject.description}</p>
            <Link to={`/subjects/${subject.slug}`} className="inline-nav-link">
              Start Questions
            </Link>
          </article>
        ))}
      </section>
    </div>
  )
}

export default SubjectCategoriesPage
