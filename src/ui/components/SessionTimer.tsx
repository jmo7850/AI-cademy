import { useEffect, useState } from 'react';
import { nowIso, useStore } from '../../store/StoreContext';

/**
 * Optional study timer. Never forced: it only offers a break when the chosen
 * session length is reached, and the learner can keep going.
 */
export function SessionTimer() {
  const { state, dispatch } = useStore();
  const target = state.profile.sessionMinutes * 60_000;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [dismissedAt, setDismissedAt] = useState(0);

  useEffect(() => {
    if (!running) return;
    const started = Date.now() - elapsed;
    const t = window.setInterval(() => setElapsed(Date.now() - started), 1000);
    return () => window.clearInterval(t);
    // elapsed is captured once per start/resume on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const end = () => {
    const minutes = Math.round(elapsed / 60_000);
    if (minutes > 0) dispatch({ type: 'logSession', minutes, now: nowIso() });
    setRunning(false);
    setElapsed(0);
    setDismissedAt(0);
  };

  const mm = Math.floor(elapsed / 60_000);
  const ss = Math.floor((elapsed % 60_000) / 1000).toString().padStart(2, '0');
  const showBreak = state.profile.breakPrompts && elapsed >= target && elapsed - dismissedAt >= target;

  return (
    <div className="row small" aria-label="Study session">
      {elapsed === 0 && !running ? (
        <button type="button" onClick={() => setRunning(true)}>Start {state.profile.sessionMinutes}-min session</button>
      ) : (
        <>
          <span className="timer" aria-live="off">{mm}:{ss} / {state.profile.sessionMinutes}:00</span>
          <button type="button" onClick={() => setRunning(!running)}>{running ? 'Pause' : 'Resume'}</button>
          <button type="button" onClick={end}>End session</button>
        </>
      )}
      {showBreak && (
        <div className="notice" role="status" style={{ flexBasis: '100%' }}>
          You have studied {mm} minutes. A short break helps it stick. Your place is saved.
          <div className="row" style={{ marginTop: 6 }}>
            <button type="button" onClick={() => setDismissedAt(elapsed)}>Keep going</button>
            <button type="button" onClick={end}>End session</button>
          </div>
        </div>
      )}
    </div>
  );
}
