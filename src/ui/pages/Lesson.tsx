import { useEffect, useState } from 'react';
import type { CatalogEntry, Lesson, StudyCourse } from '../../domain/types';
import { newSeed } from '../../engine/random';
import { nowIso, useStore } from '../../store/StoreContext';
import { ProgressBar } from '../components/bits';
import { QuestionView } from '../components/QuestionView';
import { go, href } from '../router';

export function LessonPage({ entryId, lessonId, section, focus }: { entryId: string; lessonId?: string; section?: number; focus: boolean }) {
  const { state, registry } = useStore();
  const entry = registry.entry(entryId);
  const course = registry.courseForEntry(entryId);
  const progress = state.courses[entryId];

  const lesson: Lesson | undefined = course
    ? course.lessons.find((l) => l.id === lessonId) ??
      course.lessons.find((l) => l.id === progress?.position?.lessonId) ??
      course.lessons.find((l) => !progress?.completedLessons.includes(l.id)) ??
      course.lessons[0]
    : undefined;

  if (!entry || !course) return <div className="card"><h1>No in-app lessons</h1><p>This entry is studied on the provider's site.</p><a href={href('course', entryId)}>Back to course</a></div>;
  if (!lesson) return <div className="card"><h1>{course.title}</h1><p>This course has no lessons yet. Use the Practice Center for its questions.</p><a href={href('practice')}>Practice Center</a></div>;
  const savedStep = section !== undefined && Number.isInteger(section) && section >= 0 && section < lesson.sections.length
    ? section
    : progress?.position?.lessonId === lesson.id ? progress.position.section : 0;
  return <LessonView key={`${lesson.id}:${section ?? ''}`} entry={entry} course={course} lesson={lesson} initialStep={savedStep} focus={focus} />;
}

function LessonView({ entry, course, lesson, initialStep, focus }: { entry: CatalogEntry; course: StudyCourse; lesson: Lesson; initialStep: number; focus: boolean }) {
  const { state, dispatch, registry } = useStore();
  const progress = state.courses[entry.id];
  const [step, setStep] = useState(initialStep);
  const [answered, setAnswered] = useState(false);
  const [seed] = useState(newSeed);

  useEffect(() => {
    dispatch({ type: 'setPosition', entryId: entry.id, lessonId: lesson.id, section: step, now: nowIso() });
  }, [step, lesson.id, entry.id, dispatch]);


  const S = lesson.sections.length;
  const checks = lesson.checkIds.map((id) => registry.question(course.id, id)).filter((q) => !!q);
  const total = S + checks.length + 1;
  const idx = lessonIndex(course.lessons, lesson.id);
  const nextLesson = course.lessons[idx + 1];
  const done = progress?.completedLessons.includes(lesson.id);
  const completedCount = course.lessons.filter((l) => progress?.completedLessons.includes(l.id)).length;

  const advance = () => {
    setAnswered(false);
    setStep((s) => Math.min(s + 1, total - 1));
  };

  let body: React.ReactNode;
  if (step < S) {
    const sec = lesson.sections[step]!;
    body = (
      <section aria-labelledby="sec-h">
        <h2 id="sec-h">{sec.heading}</h2>
        {sec.body.split('\n\n').map((p, i) => <p key={i} style={{ whiteSpace: 'pre-line' }}>{p}</p>)}
        {sec.diagram && <Diagram {...sec.diagram} />}
        {sec.code && <pre>{sec.code}</pre>}
        {sec.example && (
          <div className="notice"><strong>Worked example. </strong><span style={{ whiteSpace: 'pre-line' }}>{sec.example}</span></div>
        )}
        {sec.nonExample && <div className="notice"><strong>Not the same thing. </strong><span style={{ whiteSpace: 'pre-line' }}>{sec.nonExample}</span></div>}
        {sec.misconception && <div className="notice"><strong>Common mix-up. </strong><span style={{ whiteSpace: 'pre-line' }}>{sec.misconception}</span></div>}
        {sec.recap && <p><strong>Remember: </strong>{sec.recap}</p>}
        {sec.details && (
          <details>
            <summary>Go deeper (optional)</summary>
            <p style={{ marginTop: 8 }}>{sec.details}</p>
          </details>
        )}
        <div className="row">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)}>Back</button>}
          <button type="button" className="primary" onClick={advance}>{step + 1 < S ? 'Next section' : checks.length ? 'Check what you learned' : 'Finish lesson'}</button>
        </div>
      </section>
    );
  } else if (step < S + checks.length) {
    const q = checks[step - S]!;
    body = (
      <section aria-labelledby="chk-h">
        <h2 id="chk-h">Knowledge check {step - S + 1} of {checks.length}</h2>
        <QuestionView
          key={q.id}
          courseId={course.id}
          question={q}
          seed={seed}
          onSubmit={(r, _a, confidence) => {
            setAnswered(true);
            dispatch({ type: 'recordAnswer', attempt: { itemId: q.id, courseId: course.id, conceptIds: q.conceptIds, correct: r.correct, confidence, at: nowIso(), context: 'lesson' }, difficulty: q.difficulty });
          }}
        />
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" onClick={() => setStep(step - 1)}>Back</button>
          {answered && <button type="button" className="primary" onClick={advance}>Continue</button>}
        </div>
        {answered && <p className="small muted">Missed questions come back in your review queue, so there is no need to retry now.</p>}
      </section>
    );
  } else {
    body = (
      <section aria-labelledby="fin-h">
        <h2 id="fin-h">{done ? 'Lesson complete' : 'Apply it'}</h2>
        {lesson.sections.some((x) => x.recap) && (
          <div className="card">
            <h3>What to remember</h3>
            <ul>{lesson.sections.filter((x) => x.recap).map((x) => <li key={x.heading}><strong>{x.heading}.</strong> {x.recap}</li>)}</ul>
          </div>
        )}
        {lesson.practical && <div className="notice"><strong>Practical task (about 5 minutes). </strong>{lesson.practical}</div>}
        {lesson.sourceLinks && (
          <>
            <h3>Original sources</h3>
            <ul>{lesson.sourceLinks.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul>
          </>
        )}
        {!done ? (
          <button type="button" className="primary" onClick={() => dispatch({ type: 'completeLesson', entryId: entry.id, lessonId: lesson.id, now: nowIso() })}>Mark lesson complete</button>
        ) : (
          <div className="feedback ok" role="status">
            <p><strong>Done: {lesson.title}.</strong> {completedCount} of {course.lessons.length} lessons in this course complete.</p>
            <div className="row">
              {nextLesson ? (
                <button type="button" className="primary" onClick={() => go('learn', entry.id, nextLesson.id)}>Next lesson: {nextLesson.title}</button>
              ) : course.blueprint ? (
                <button type="button" className="primary" onClick={() => go('practice')}>Take a practice exam</button>
              ) : (
                <button type="button" className="primary" onClick={() => go('review', course.id)}>Review this course</button>
              )}
              <button type="button" onClick={() => go()}>Stop here for now</button>
            </div>
          </div>
        )}
      </section>
    );
  }

  return (
    <article>
      {!focus && <p><a href={href('course', entry.id)}>← {entry.title}</a></p>}
      <p className="muted small" style={{ margin: 0 }}>{course.title} · Lesson {idx + 1} of {course.lessons.length} · about {lesson.minutes} min</p>
      <h1>{lesson.title}</h1>
      <ProgressBar value={(step + (done ? 1 : 0)) / total} label="Lesson progress" />
      <p className="small muted" style={{ marginTop: 4 }}>Step {Math.min(step + 1, total)} of {total}. Your place is saved automatically.</p>
      {step === 0 && (
        <div className="card">
          <h2 style={{ fontSize: '1rem' }}>By the end you can</h2>
          <ul style={{ margin: 0 }}>{lesson.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
        </div>
      )}
      <div className="card">{body}</div>
      {!focus && (
        <details>
          <summary>All lessons ({completedCount} of {course.lessons.length} done)</summary>
          <ol>
            {course.lessons.map((l) => (
              <li key={l.id}>
                <a href={href('learn', entry.id, l.id)} aria-current={l.id === lesson.id ? 'step' : undefined}>{l.title}</a>
                {progress?.completedLessons.includes(l.id) && ' ✓'}
              </li>
            ))}
          </ol>
        </details>
      )}
    </article>
  );
}

const lessonIndex = (lessons: Lesson[], id: string) => lessons.findIndex((l) => l.id === id);

function Diagram({ caption, flow }: { caption: string; flow: string[] }) {
  return (
    <figure style={{ margin: '12px 0' }}>
      <ol className="row" style={{ listStyle: 'none', padding: 0, margin: 0, flexWrap: 'wrap' }} aria-label={caption}>
        {flow.map((f, i) => (
          <li key={f} className="badge b-estimate" style={{ padding: '6px 10px' }}>{i > 0 && <span aria-hidden="true">→ </span>}{f}</li>
        ))}
      </ol>
      <figcaption className="small muted">{caption}</figcaption>
    </figure>
  );
}
