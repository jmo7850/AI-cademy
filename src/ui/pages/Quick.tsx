import { useState } from 'react';
import { quickCredentials, quickFilterLabel, tradeOff, type QuickFilter } from '../../engine/catalogFilter';
import { useStore } from '../../store/StoreContext';
import { FactBadge, hoursText, TypeBadge } from '../components/bits';
import { href } from '../router';
import { costSummary } from './Catalog';

export function QuickPage() {
  const { registry } = useStore();
  const [filters, setFilters] = useState<QuickFilter[]>([]);
  const list = quickCredentials(registry.entries, filters);
  const toggle = (f: QuickFilter) => setFilters(filters.includes(f) ? filters.filter((x) => x !== f) : [...filters, f]);

  return (
    <div>
      <h1>Quick Credentials</h1>
      <p>Short courses, badges and beginner certifications, shortest first. Fast is not the same as valuable: a 45-minute badge shows initiative, while a proctored certification takes longer and costs money but carries more weight with employers. Pair either with a project.</p>
      <div className="row" role="group" aria-label="Filters">
        {(Object.keys(quickFilterLabel) as QuickFilter[]).map((f) => (
          <button key={f} type="button" className="chip" aria-pressed={filters.includes(f)} onClick={() => toggle(f)}>{quickFilterLabel[f]}</button>
        ))}
        {filters.length > 0 && <button type="button" className="link" onClick={() => setFilters([])}>Clear filters</button>}
      </div>
      <p className="small muted">Time filters use study hours: 1 day = 8 hours, 1 week = 40 hours.</p>
      <p className="small muted" role="status">{list.length} option{list.length === 1 ? '' : 's'}</p>
      {list.length === 0 && <div className="card muted">No options match all of these filters. Remove one to see more.</div>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {list.map((e) => {
          const formal = e.credentialType === 'foundational-cert' || e.credentialType === 'professional-cert';
          return (
            <li key={e.id} className="card">
              <h2 style={{ marginBottom: 4 }}><a href={href('course', e.id)}>{e.title}</a></h2>
              <div className="row small"><TypeBadge entry={e} /><span className="muted">{e.difficulty}</span>{e.availability.value === 'available' ? <span className="badge b-verified">Available</span> : <span className="badge b-unverified">Availability unconfirmed</span>}</div>
              <div className="table-wrap" style={{ marginTop: 8 }}>
                <table className="small">
                  <tbody>
                    <tr><th scope="row">{formal ? 'Preparation time' : 'Learning time'}</th><td>{hoursText(e.studyHours.value)} <FactBadge fact={e.studyHours} checkedOn={e.checkedOn} /></td></tr>
                    {e.exam?.minutes && <tr><th scope="row">Exam time</th><td>{e.exam.minutes.value} min <FactBadge fact={e.exam.minutes} checkedOn={e.checkedOn} /></td></tr>}
                    <tr><th scope="row">Cost</th><td>{costSummary(e)} <FactBadge fact={e.exam?.feeUSD ?? e.credentialFree} checkedOn={e.checkedOn} /></td></tr>
                    <tr><th scope="row">Proctored exam</th><td>{e.exam?.proctored.value ? 'Yes' : 'No'}</td></tr>
                    <tr><th scope="row">Prerequisites</th><td>{e.prerequisites.join(' ') || 'None listed'}{e.programmingRequired ? ' · programming required' : ''}</td></tr>
                    <tr><th scope="row">What it proves</th><td>{e.proves}</td></tr>
                    <tr><th scope="row">Career value</th><td>{e.careerValue}</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="small" style={{ marginTop: 8 }}><strong>Trade-off:</strong> {tradeOff(e)}</p>
              {e.registrationUrl && <a href={e.registrationUrl} target="_blank" rel="noreferrer">Official enrolment page</a>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
