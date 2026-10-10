/** Decorative robot mascot with a graduation cap (brand: navy, cyan, gold). Hidden from assistive tech. */
export function Mascot({ size = 40, className = 'mascot' }: { size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <line x1="60" y1="30" x2="60" y2="38" stroke="#00FFFF" strokeWidth="3" />
      <rect x="22" y="38" width="76" height="58" rx="18" fill="#13306A" stroke="#00FFFF" strokeWidth="3" />
      <rect x="32" y="50" width="56" height="30" rx="12" fill="#061330" />
      <circle cx="47" cy="65" r="6" fill="#00FFFF" />
      <circle cx="73" cy="65" r="6" fill="#00FFFF" />
      <path d="M50 86 Q60 92 70 86" stroke="#00FFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="14" y="58" width="8" height="18" rx="4" fill="#00FFFF" />
      <rect x="98" y="58" width="8" height="18" rx="4" fill="#00FFFF" />
      <polygon points="60,8 100,22 60,36 20,22" fill="#FFC700" />
      <rect x="44" y="24" width="32" height="10" rx="2" fill="#E0AE00" />
      <line x1="96" y1="23" x2="96" y2="40" stroke="#FFC700" strokeWidth="3" />
      <circle cx="96" cy="42" r="4" fill="#FFC700" />
    </svg>
  );
}
