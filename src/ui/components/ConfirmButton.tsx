import { useState } from 'react';

/**
 * Two-step in-page confirmation. Used instead of window.confirm(), which some
 * embedded viewers block, and which interrupts focus.
 */
export function ConfirmButton({ label, question, confirmLabel = 'Yes, continue', onConfirm, className }: {
  label: string;
  question: string;
  confirmLabel?: string;
  onConfirm: () => void;
  className?: string;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <button type="button" className={className} onClick={() => setAsking(true)}>{label}</button>;
  return (
    <span className="notice warn row" role="alert" style={{ display: 'inline-flex', margin: 0 }}>
      <span>{question}</span>
      <button type="button" className="primary" onClick={() => { setAsking(false); onConfirm(); }}>{confirmLabel}</button>
      <button type="button" onClick={() => setAsking(false)}>Cancel</button>
    </span>
  );
}
