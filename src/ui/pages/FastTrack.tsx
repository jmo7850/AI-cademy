import { useState } from 'react';
import { fastTrackById, fastTracks } from '../../data/fastTracks';
import { estimateFinish, PACES, trackHours, trackSteps } from '../../engine/fastTrack';
import { useStore } from '../../store/StoreContext';
import { FactBadge, hoursText } from '../components/bits';
import { href } from '../router';
import { OutsideBadge } from './Outside';

export function FastTrackIndex() {
  return (
    <div>
      <p><a href={href('paths')}>← Career Paths</a></p>
      <h1>Fast tracks</h1>
      <p className="muted">A fixed order and a fixed hours budget. You choose the pace and nothing counts down. Each is the shortest ordered route among the courses this app lists, not a promise that nothing is faster.</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {fastTracks.map((t) => (
          <li key={t.id} className="card"><h2><a href={href('fast', t.id)}>{t.title}</a></h2><p>{t.summary}</p></li>
        ))}
      </ul>
    </div>
  );
}

export function FastTrackPage({ trackId }: { trackId: string }) {
  const { state, dispatch, registry } = useStore();
  const track = fastTrackById.get(trackId);
  const [pace, setPace] = useState<number>(PACES[1]);
  if (!track) return <FastTrackIndex />;

  const steps = trackSteps(track, (id) => registry.entry(id), state.courses);
  const { total, remaining } = trackHours(steps);
  const eta = estimateFinish(remaining, pace, new Date());
  const planId = `plan-fast-${track.id}`;
  const hasPlan = state.plans.some((p) => p.id === planId);
  const usePlan = () => dispatch({
    type: 'savePlan', activate: true,
    plan: { id: planId, title: track.title, createdFrom: `fast-${track.id}`, steps: steps.map((s) => ({ title: s.entry.title, catalogIds: [s.entry.id], why: s.why })) },
  });

  return (
    <article>
      <p><a href={href('fast')}>← Fast tracks</a></p>
      <h1>{track.title}</h1>
      <p>{track.summary}</p>

      <section className="card" aria-labelledby="ft-cred">
        <h2 id="ft-cred">What you get</h2>
        <p><strong>{track.credential.name}.</strong> {track.credential.note}</p>
        <p className="small muted">Poqeni never marks a badge or credential as earned. You record it yourself after the provider issues it.</p>
      </section>

      <section className="card" aria-labelledby="ft-pace">
        <h2 id="ft-pace">Your pace</h2>
        <div className="field">
          <label htmlFor="ft-pace-sel">Hours a week</label>
          <select id="ft-pace-sel" value={pace} onChange={(e) => setPace(Number(e.target.value))}>
            {PACES.map((p) => <option key={p} value={p}>{p} hours a week</option>)}
          </select>
        </div>
        <p role="status">
          {remaining === 0
            ? `You said you finished every required course (${hoursText(total)} of listed course time).`
            : `${hoursText(remaining)} of listed course time to go, out of ${hoursText(total)}. At ${pace} hours a week that is about ${eta.weeks} week${eta.weeks === 1 ? '' : 's'}, around ${eta.around.toISOString().slice(0, 10)}. It is an estimate, so go faster or slower as you like.`}
        </p>
      </section>

      <ol style={{ paddingLeft: 0, listStyle: 'none' }}>
        {steps.map((s, i) => (
          <li key={s.entry.id} className="card">
            <h2 style={{ margin: 0 }}>Step {i + 1}: <a href={href('course', s.entry.id)}>{s.entry.title}</a>{s.optional ? ' (optional)' : ''}</h2>
            <p className="small">{hoursText(s.entry.studyHours.value)} <FactBadge fact={s.entry.studyHours} checkedOn={s.entry.checkedOn} /> · <OutsideBadge entry={s.entry} />{!s.saidDone && ' Not finished yet'}</p>
            <p>{s.why}</p>
            <p className="small muted">Badge: {s.entry.credentialFree.value ? 'listed' : 'not listed'} <FactBadge fact={s.entry.credentialFree} checkedOn={s.entry.checkedOn} />{s.entry.credentialFree.note ? ` ${s.entry.credentialFree.note}` : ''}</p>
          </li>
        ))}
      </ol>

      <div className="row">
        <button type="button" className="primary" onClick={usePlan} disabled={hasPlan}>{hasPlan ? 'This is one of your plans' : 'Use as my plan'}</button>
        {hasPlan && <a className="btn" href={href('paths')}>Open my plans</a>}
      </div>
      <p className="small muted">Catalog facts checked on {steps[0]?.entry.checkedOn}. Course lengths come from the provider's listing.</p>
    </article>
  );
}
