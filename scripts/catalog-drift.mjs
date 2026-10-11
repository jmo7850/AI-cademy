// Lists catalog source pages that changed, moved or became unreachable since they were checked.
// A person re-reads each flagged page and updates the facts; nothing here edits the catalog.
// Run with `npm run catalog:drift`. Exits 1 only when a page is gone (404 or 410).
import { appendFileSync } from 'node:fs';
import { createServer } from 'vite';

const TIMEOUT_MS = 20_000;
const CONCURRENCY = 6;

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
const { catalog } = await vite.ssrLoadModule('/src/data/catalog.ts');
const { builtInCourses } = await vite.ssrLoadModule('/src/data/curriculum/index.ts');
const { CATALOG_CHECKED_ON, STALE_AFTER_DAYS } = await vite.ssrLoadModule('/src/data/facts.ts');
await vite.close();

/** url -> { ids, checkedOn } */
const sources = new Map();
const add = (url, id, checkedOn) => {
  if (!url) return;
  const s = sources.get(url) ?? { ids: [], checkedOn };
  s.ids.push(id);
  if (checkedOn < s.checkedOn) s.checkedOn = checkedOn;
  sources.set(url, s);
};
for (const e of catalog) {
  if (e.origin !== 'official') continue;
  const on = e.checkedOn ?? CATALOG_CHECKED_ON;
  for (const url of new Set([e.sourceUrl, e.officialUrl, e.registrationUrl])) add(url, e.id, on);
}
for (const c of builtInCourses) add(c.blueprint?.sourceUrl, `${c.id} blueprint`, CATALOG_CHECKED_ON);

async function check(url, { checkedOn }) {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': 'PathBolt catalog drift check (+https://github.com/jmo7850/AI-cademy)' },
    });
    await res.body?.cancel();
    if (res.status === 404 || res.status === 410) return { kind: 'gone', detail: `HTTP ${res.status}` };
    if (!res.ok) return { kind: 'blocked', detail: `HTTP ${res.status}` };
    const moved = new URL(res.url);
    const asked = new URL(url);
    if (moved.host !== asked.host || moved.pathname.replace(/\/$/, '') !== asked.pathname.replace(/\/$/, '')) {
      return { kind: 'moved', detail: `now ${res.url}` };
    }
    const modified = res.headers.get('last-modified');
    if (modified && new Date(modified).toISOString().slice(0, 10) > checkedOn) {
      return { kind: 'changed', detail: `last modified ${new Date(modified).toISOString().slice(0, 10)}` };
    }
    return { kind: 'ok' };
  } catch (err) {
    return { kind: 'unreachable', detail: err instanceof Error ? String(err.cause?.code || err.cause?.message || err.message) : String(err) };
  }
}

const entries = [...sources];
const results = [];
for (let i = 0; i < entries.length; i += CONCURRENCY) {
  const batch = entries.slice(i, i + CONCURRENCY);
  results.push(...(await Promise.all(batch.map(async ([url, s]) => ({ url, ...s, ...(await check(url, s)) })))));
}

const today = new Date().toISOString().slice(0, 10);
const daysSince = (d) => Math.floor((Date.parse(today) - Date.parse(d)) / 86_400_000);
const stale = [...new Set(results.filter((r) => daysSince(r.checkedOn) > STALE_AFTER_DAYS).flatMap((r) => r.ids))];

const LABEL = {
  gone: 'Gone: replace the link',
  moved: 'Moved: re-read and update the link',
  changed: 'Changed since it was checked: re-read',
  blocked: 'Blocked or erroring: check by hand',
  unreachable: 'No response: check by hand',
};
const flagged = results.filter((r) => r.kind !== 'ok');
const lines = [`## Catalog drift check, ${today}`, '', `${results.length} source pages checked; ${flagged.length} need a person to look.`, ''];
if (flagged.length) {
  lines.push('| Status | Page | Used by | Detail |', '| --- | --- | --- | --- |');
  for (const r of flagged.sort((a, b) => a.kind.localeCompare(b.kind))) {
    lines.push(`| ${LABEL[r.kind]} | ${r.url} | ${r.ids.join(', ')} | ${r.detail} |`);
  }
  lines.push('');
}
if (stale.length) lines.push(`Older than ${STALE_AFTER_DAYS} days, re-check even if unchanged: ${stale.join(', ')}`, '');

const report = lines.join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
process.exitCode = results.some((r) => r.kind === 'gone') ? 1 : 0;
