import { useState } from 'react';
import { projectById, projects } from '../../data/projects';
import type { Project } from '../../domain/types';
import { nowIso, useStore } from '../../store/StoreContext';
import { Empty, FactBadge, hoursText, ProgressBar } from '../components/bits';
import { href } from '../router';

const HW: Record<Project['hardware'], string> = {
  laptop: 'Runs on a normal laptop',
  'gpu-recommended': 'Consumer GPU recommended; larger models need rented compute',
  'gpu-required': 'Requires a substantial GPU or rented compute',
};

export function ProjectsPage() {
  const { state } = useStore();
  const portfolio = projects.filter((p) => state.projects[p.id]?.portfolio);
  return (
    <div>
      <h1>Project Lab</h1>
      <p className="muted">Hands-on work that proves you can apply what you studied. Projects move from small exercises to capstones.</p>
      {(['exercise', 'project', 'capstone'] as const).map((level) => (
        <section key={level} aria-labelledby={`lvl-${level}`}>
          <h2 id={`lvl-${level}`} style={{ textTransform: 'capitalize' }}>{level}s</h2>
          <div className="grid">
            {projects.filter((p) => p.level === level).map((p) => {
              const prog = state.projects[p.id];
              return (
                <div className="card" key={p.id}>
                  <h3><a href={href('project', p.id)}>{p.title}</a></h3>
                  <p className="small muted">{hoursText(p.hours.value)} <FactBadge fact={p.hours} /> · {HW[p.hardware]}</p>
                  {prog ? (
                    <>
                      <ProgressBar value={prog.milestones.length / p.milestones.length} label={`${p.title} milestones`} />
                      <p className="small">{prog.milestones.length} of {p.milestones.length} milestones{prog.portfolio ? ' · in portfolio' : ''}</p>
                    </>
                  ) : <p className="small">Not started</p>}
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <section aria-labelledby="pf-h">
        <h2 id="pf-h">Portfolio ({portfolio.length})</h2>
        {portfolio.length === 0 ? <Empty>Finished projects you add to your portfolio appear here, with the skills they demonstrate and your evidence link.</Empty> : (
          portfolio.map((p) => {
            const pf = state.projects[p.id]!.portfolio!;
            return (
              <div className="card" key={p.id}>
                <h3>{p.title}</h3>
                <p>{pf.summary}</p>
                <p className="small"><strong>Skills shown:</strong> {pf.skills.join(', ')}</p>
                <a href={pf.evidenceUrl} target="_blank" rel="noreferrer">Evidence</a>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

export function ProjectPage({ projectId }: { projectId: string }) {
  const { state, dispatch } = useStore();
  const p = projectById.get(projectId);
  const prog = state.projects[projectId];
  if (!p) return <Empty>Project not found. <a href={href('projects')}>Project Lab</a></Empty>;
  const allDone = !!prog && prog.milestones.length === p.milestones.length;

  return (
    <article>
      <p><a href={href('projects')}>← Project Lab</a></p>
      <h1>{p.title}</h1>
      <p className="muted small">{p.level} · {hoursText(p.hours.value)} <FactBadge fact={p.hours} /> · {HW[p.hardware]}</p>
      {p.hours.note && <p className="small muted">{p.hours.note}</p>}
      <section className="card"><h2>Objectives</h2><ul>{p.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
        <h3>Prerequisites</h3><ul>{p.prerequisites.map((o) => <li key={o}>{o}</li>)}</ul></section>
      <section className="card">
        <h2>Milestones</h2>
        {!prog ? (
          <button type="button" className="primary" onClick={() => dispatch({ type: 'startProject', projectId: p.id, now: nowIso() })}>Start this project</button>
        ) : (
          <>
            <ProgressBar value={prog.milestones.length / p.milestones.length} label="Milestone progress" />
            <fieldset style={{ marginTop: 8 }}>
              <legend className="sr-only">Milestones</legend>
              {p.milestones.map((m, i) => (
                <label key={m.id} className="choice">
                  <input type="checkbox" checked={prog.milestones.includes(m.id)} onChange={() => dispatch({ type: 'toggleMilestone', projectId: p.id, milestoneId: m.id })} />
                  <span>{i + 1}. {m.text}</span>
                </label>
              ))}
            </fieldset>
          </>
        )}
      </section>
      <section className="card"><h2>Definition of done</h2><ul>{p.definitionOfDone.map((o) => <li key={o}>{o}</li>)}</ul>
        <h3>How to validate it</h3><ul>{p.validation.map((o) => <li key={o}>{o}</li>)}</ul></section>
      {prog && (
        <section className="card">
          <h2>Portfolio entry</h2>
          {!allDone && !prog.portfolio && <p className="muted">Finish all milestones, then document what you built here.</p>}
          {(allDone || prog.portfolio) && <PortfolioForm project={p} />}
        </section>
      )}
    </article>
  );
}

function PortfolioForm({ project }: { project: Project }) {
  const { state, dispatch } = useStore();
  const existing = state.projects[project.id]?.portfolio;
  const [summary, setSummary] = useState(existing?.summary ?? '');
  const [skills, setSkills] = useState<string[]>(existing?.skills ?? project.skills);
  const [url, setUrl] = useState(existing?.evidenceUrl ?? '');
  const [saved, setSaved] = useState(false);
  const urlOk = /^https:\/\/\S+$/.test(url);
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      if (!urlOk || summary.trim().length < 20) return;
      dispatch({ type: 'savePortfolio', projectId: project.id, portfolio: { summary: summary.trim(), skills, evidenceUrl: url, addedOn: nowIso() } });
      setSaved(true);
    }}>
      <div className="field">
        <label htmlFor="pf-sum">What you built, your key decisions, and how you evaluated it</label>
        <textarea id="pf-sum" value={summary} onChange={(e) => setSummary(e.target.value)} aria-describedby="pf-sum-help" />
        <p id="pf-sum-help" className="small muted">At least 20 characters. Be specific about what you did yourself.</p>
      </div>
      <fieldset>
        <legend>Skills demonstrated</legend>
        <div className="row">
          {project.skills.map((s) => (
            <button key={s} type="button" className="chip" aria-pressed={skills.includes(s)} onClick={() => setSkills(skills.includes(s) ? skills.filter((x) => x !== s) : [...skills, s])}>{s}</button>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="pf-url">Evidence link (repository, demo or write-up)</label>
        <input id="pf-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} aria-invalid={!!url && !urlOk} />
        {url && !urlOk && <p className="small">The link needs to start with https://</p>}
      </div>
      <button className="primary" type="submit" disabled={!urlOk || summary.trim().length < 20}>{existing ? 'Update portfolio entry' : 'Add to portfolio'}</button>
      {saved && <p role="status" className="small">Saved to your portfolio.</p>}
    </form>
  );
}
