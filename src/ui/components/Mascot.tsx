/**
 * Poqeni, the mascot and logo, drawn as flat line art in inline SVG so it follows the theme.
 * Strokes use `--mk-line` (cream on navy surfaces, the text colour elsewhere) and fills use `--mk-fill` (sky blue).
 * The geometry matches the supplied brand lockup (src/ui/assets/brand/poqeni-lockup-on-dark.svg); keep them in step.
 */
import type { CSSProperties, ReactNode } from 'react';

const LINE = 'var(--mk-line, #F2F0EA)';
const FILL = 'var(--mk-fill, #6FB3E0)';

const AspectHead = 215 / 200;
const AspectFull = 215 / 425;
const AspectLockup = 830.8 / 237.5;

/** A cream-ringed sky-blue disc: the antenna tips and the hands. */
const Disc = ({ cx, cy }: { cx: number; cy: number }) => (
  <>
    <circle cx={cx} cy={cy} r={15} fill="none" stroke={LINE} strokeWidth={8} />
    <circle cx={cx} cy={cy} r={15} fill={FILL} />
  </>
);

const Rod = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={LINE} strokeWidth={11} strokeLinecap="round" />
);

/** Head with antennae and mortarboard, in the lockup's coordinates (x 14–221, y 14–205). */
function Head() {
  return (
    <>
      <Rod x1={60.2} y1={100.5} x2={33} y2={49.3} />
      <Rod x1={174.6} y1={100.5} x2={201.8} y2={49.3} />
      <Disc cx={33} cy={49.3} />
      <Disc cx={201.8} cy={49.3} />
      <circle cx={117.4} cy={133.5} r={66} fill="none" stroke={LINE} strokeWidth={11} />
      <rect x={78} y={91.5} width={100} height={88} rx={30} fill={FILL} stroke={LINE} strokeWidth={7} />
      <rect x={86} y={120} width={32} height={11} rx={5.5} fill={LINE} />
      <rect x={138} y={120} width={32} height={11} rx={5.5} fill={LINE} />
      <path d="M 101.4,157.5 Q 117.4,167.5 133.4,157.5" fill="none" stroke={LINE} strokeWidth={10} strokeLinecap="round" />
      <path d="M 51.4,37.5 L 117.4,19.5 L 183.4,37.5 L 117.4,55.5 Z" fill="none" stroke={LINE} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      <Rod x1={85.4} y1={48.5} x2={85.4} y2={75.5} />
      <Rod x1={149.4} y1={48.5} x2={149.4} y2={75.5} />
    </>
  );
}

/** Neck, arms, torso, legs and feet, drawn in the same strokes as the head. */
function Body() {
  return (
    <>
      <Rod x1={117.4} y1={200} x2={117.4} y2={232} />
      <Rod x1={80} y1={252} x2={40} y2={322} />
      <Rod x1={155} y1={252} x2={195} y2={322} />
      <Rod x1={94} y1={322} x2={94} y2={402} />
      <Rod x1={141} y1={322} x2={141} y2={402} />
      <Disc cx={40} cy={322} />
      <Disc cx={195} cy={322} />
      <rect x={76} y={403} width={36} height={22} rx={11} fill={FILL} stroke={LINE} strokeWidth={7} />
      <rect x={123} y={403} width={36} height={22} rx={11} fill={FILL} stroke={LINE} strokeWidth={7} />
      <rect x={72.4} y={226} width={90} height={110} rx={30} fill={FILL} stroke={LINE} strokeWidth={7} />
      <circle cx={117.4} cy={270} r={10} fill={LINE} />
    </>
  );
}

function Art({ viewBox, aspect, size, className, style, children }: { viewBox: string; aspect: number; size: number; className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <svg className={className} style={style} viewBox={viewBox} height={size} width={Math.round(size * aspect)} role="presentation" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

/**
 * "head" is the logo mark; "full" is the standing figure. Decorative wherever it sits next to the
 * product name, so it is hidden from assistive tech.
 */
export function Mascot({ variant = 'head', size = 40, className = 'mascot' }: { variant?: 'head' | 'full'; size?: number; className?: string }) {
  return variant === 'full' ? (
    <Art viewBox="10 10 215 425" aspect={AspectFull} size={size} className={className}>
      <Body />
      <Head />
    </Art>
  ) : (
    <Art viewBox="10 10 215 200" aspect={AspectHead} size={size} className={className}>
      <Head />
    </Art>
  );
}

const WORDMARK: [string, Record<string, string | number>][] = [
  ['line', { x1: 286.8, y1: 47.5, x2: 286.8, y2: 171.5 }],
  ['path', { d: 'M 286.8,47.5 A 38,38 0 0,1 286.8,123.5' }],
  ['circle', { cx: 398.8, cy: 131.5, r: 40 }],
  ['circle', { cx: 510.8, cy: 131.5, r: 40 }],
  ['line', { x1: 550.8, y1: 161.5, x2: 550.8, y2: 213.5 }],
  ['line', { x1: 582.8, y1: 131.5, x2: 662.8, y2: 131.5 }],
  ['path', { d: 'M 662.8,131.5 A 40,40 0 1,0 655.57,154.44' }],
  ['line', { x1: 694.8, y1: 81.5, x2: 694.8, y2: 171.5 }],
  ['path', { d: 'M 694.8,119.5 A 40,40 0 0,1 774.8,119.5' }],
  ['line', { x1: 774.8, y1: 119.5, x2: 774.8, y2: 171.5 }],
  ['line', { x1: 806.8, y1: 81.5, x2: 806.8, y2: 171.5 }],
];

/** The horizontal lockup: mark plus the lowercase wordmark. Always shown on navy, so it uses the cream strokes. */
export function Lockup({ size = 44, className = 'lockup' }: { size?: number; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 830.8 237.5" height={size} width={Math.round(size * AspectLockup)} role="img" aria-label="Poqeni">
      <title>Poqeni</title>
      <Head />
      {WORDMARK.map(([tag, props], i) => {
        const stroke = { fill: 'none', stroke: LINE, strokeWidth: 20, strokeLinecap: 'round' as const };
        if (tag === 'line') return <line key={i} {...stroke} {...(props as object)} />;
        if (tag === 'circle') return <circle key={i} {...stroke} {...(props as object)} />;
        return <path key={i} {...stroke} {...(props as object)} />;
      })}
      <circle cx={806.8} cy={55.5} r={10} fill={LINE} />
    </svg>
  );
}
