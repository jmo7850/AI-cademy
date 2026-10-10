import type { CatalogEntry, Fact } from '../../domain/types';
import { credentialTypeLabel, isStale, providerLabel } from '../../engine/catalogFilter';
import { statusLabel, type CourseStatus } from '../../engine/mastery';

const FACT_LABEL = { verified: 'Verified', unverified: 'Unverified', estimate: 'Estimate' } as const;

/** Every external fact is shown with its provenance. */
export function FactBadge({ fact, checkedOn }: { fact: Fact<unknown>; checkedOn?: string }) {
  const title = [fact.status === 'verified' && checkedOn ? `Checked on official page ${checkedOn}` : '', fact.note ?? ''].filter(Boolean).join('. ');
  return (
    <span className={`badge b-${fact.status}`} title={title || undefined}>
      {FACT_LABEL[fact.status]}
      <span className="sr-only">{title ? `: ${title}` : ''}</span>
    </span>
  );
}

export function FactLine({ label, fact, checkedOn, render }: { label: string; fact?: Fact<unknown>; checkedOn?: string; render?: (v: unknown) => string }) {
  if (!fact) return null;
  const shown = render ? render(fact.value) : String(fact.value);
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>
        {shown} <FactBadge fact={fact} checkedOn={checkedOn} />
        {fact.note && <div className="small muted">{fact.note}</div>}
      </td>
    </tr>
  );
}

export function TypeBadge({ entry }: { entry: CatalogEntry }) {
  return <span className={`badge b-type t-${entry.credentialType}`}>{credentialTypeLabel[entry.credentialType]}</span>;
}

export function StatusPill({ status }: { status: CourseStatus }) {
  const tone = status === 'not-started' ? 'b-estimate' : status === 'in-progress' ? 'b-unverified' : status === 'mastery' || status === 'external-recorded' ? 'b-gold' : 'b-verified';
  return <span className={`badge ${tone}`}>{statusLabel[status]}</span>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function hoursText(h: number): string {
  if (h < 1) return `${Math.round(h * 60)} min`;
  return `${h % 1 === 0 ? h : h.toFixed(1)} hr`;
}

export function EntryMeta({ entry, recheckedOn }: { entry: CatalogEntry; recheckedOn?: string }) {
  const stale = isStale(entry, recheckedOn, new Date());
  return (
    <div className="row small">
      <TypeBadge entry={entry} />
      <span className="muted">{providerLabel[entry.provider]}</span>
      <span className="muted">· {entry.difficulty}</span>
      <span className="muted">· {hoursText(entry.studyHours.value)}</span> <FactBadge fact={entry.studyHours} checkedOn={entry.checkedOn} />
      {entry.availability.value === 'retired' && <span className="badge b-bad">Retired</span>}
      {entry.origin === 'user' && <span className="badge b-unverified">User-added</span>}
      {stale && <span className="badge b-unverified">Needs re-check</span>}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card muted">{children}</div>;
}
