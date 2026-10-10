import fullUrl from '../assets/bolt-full.webp';
import headUrl from '../assets/bolt-head.webp';

/**
 * Bolt, the PathBolt mascot. "head" is the logo mark; "full" is the standing figure.
 * Decorative wherever it sits next to the product name, so it is hidden from assistive tech.
 */
export function Mascot({ variant = 'head', size = 40, className = 'mascot' }: { variant?: 'head' | 'full'; size?: number; className?: string }) {
  const full = variant === 'full';
  return (
    <img
      className={className}
      src={full ? fullUrl : headUrl}
      alt=""
      aria-hidden="true"
      height={size}
      width={full ? Math.round(size * 0.478) : size}
      decoding="async"
    />
  );
}
