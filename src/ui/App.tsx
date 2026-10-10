import { useEffect, useRef, useState } from 'react';
import { dueCards } from '../engine/srs';
import { useStore } from '../store/StoreContext';
import { SessionTimer } from './components/SessionTimer';
import { href, useRoute } from './router';
import { CatalogPage, EntryPage } from './pages/Catalog';
import { HomePage } from './pages/Home';
import { LessonPage } from './pages/Lesson';
import { MyLearningPage } from './pages/MyLearning';
import { OnboardingPage } from './pages/Onboarding';
import { PathsPage } from './pages/Paths';
import { ExamPage, FlashcardsPage, PracticePage, ReviewPage } from './pages/Practice';
import { ProgressPage } from './pages/Progress';
import { ProjectPage, ProjectsPage } from './pages/Projects';
import { QuickPage } from './pages/Quick';
import { SettingsPage } from './pages/Settings';

const NAV: [string, string][] = [
  ['', 'Home'],
  ['catalog', 'Course Catalog'],
  ['my', 'My Learning'],
  ['paths', 'Career Paths'],
  ['quick', 'Quick Credentials'],
  ['practice', 'Practice Center'],
  ['projects', 'Project Lab'],
  ['progress', 'Progress'],
  ['settings', 'Settings'],
];

/** Which nav section a route belongs to. */
const SECTION: Record<string, string> = { course: 'catalog', learn: 'my', exam: 'practice', review: 'practice', flashcards: 'practice', project: 'projects' };

export function App() {
  const route = useRoute();
  const { state, storageError } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const [head = '', a, b] = route;
  const section = SECTION[head] ?? head;
  const routeKey = route.join('/');

  useEffect(() => {
    setMenuOpen(false);
    document.title = `${NAV.find(([k]) => k === section)?.[1] ?? 'Study'} · AI Career Academy`;
    mainRef.current?.focus({ preventScroll: true });
  }, [routeKey, section]);

  useEffect(() => {
    const t = state.profile.theme;
    if (t === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
  }, [state.profile.theme]);

  const dueCount = state.profile.reminders ? dueCards(state.reviews, new Date()).length : 0;

  const page = (() => {
    if (!state.profile.onboarded && head !== 'onboarding' && head !== 'settings') return <OnboardingPage />;
    switch (head) {
      case '': return <HomePage />;
      case 'onboarding': return <OnboardingPage />;
      case 'catalog': return <CatalogPage />;
      case 'course': return <EntryPage entryId={a ?? ''} />;
      case 'learn': return <LessonPage entryId={a ?? ''} lessonId={b} focus={focus} />;
      case 'my': return <MyLearningPage />;
      case 'paths': return <PathsPage />;
      case 'quick': return <QuickPage />;
      case 'practice': return <PracticePage />;
      case 'review': return <ReviewPage courseId={a} />;
      case 'flashcards': return <FlashcardsPage courseId={a ?? ''} />;
      case 'exam': return <ExamPage examId={a ?? ''} />;
      case 'projects': return <ProjectsPage />;
      case 'project': return <ProjectPage projectId={a ?? ''} />;
      case 'progress': return <ProgressPage />;
      case 'settings': return <SettingsPage />;
      default: return <NotFound />;
    }
  })();

  return (
    <>
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
      <div className={`shell ${focus ? 'focus' : ''}`}>
        {!focus && (
          <nav className={`nav ${menuOpen ? 'open' : ''}`} aria-label="Main">
            <div className="brand">AI Career Academy</div>
            <button type="button" className="menu-btn" aria-expanded={menuOpen} aria-controls="nav-list" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? 'Close menu' : 'Menu'}
            </button>
            <ul id="nav-list">
              {NAV.map(([k, label]) => (
                <li key={k}>
                  <a href={href(...(k ? [k] : []))} aria-current={section === k ? 'page' : undefined}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <main id="main" ref={mainRef} tabIndex={-1}>
          <div className="topbar">
            <button type="button" aria-pressed={focus} onClick={() => setFocus(!focus)}>{focus ? 'Exit focus mode' : 'Focus mode'}</button>
            <SessionTimer />
          </div>
          {storageError && <div className="notice warn" role="alert">{storageError}</div>}
          {dueCount > 0 && head !== 'review' && head !== '' && head !== 'exam' && (
            <div className="notice" role="status">Reminder: {dueCount} review item{dueCount === 1 ? ' is' : 's are'} due. <a href={href('review')}>Review now</a></div>
          )}
          {page}
        </main>
      </div>
    </>
  );
}

function NotFound() {
  return (
    <div className="card">
      <h1>Page not found</h1>
      <p>That link does not match a page in this app.</p>
      <a className="btn primary" href={href()}>Go to Home</a>
    </div>
  );
}
