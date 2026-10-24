import { Heart } from 'lucide-react';

export default function LoadingAnimation({ label = 'Loading…', compact = false }) {
  return (
    <div
      className={`loader ${compact ? 'loader--compact' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="loader__orb" aria-hidden="true">
        <span className="loader__ring" />
        <span className="loader__ring loader__ring--late" />
        <Heart className="loader__heart" size={compact ? 26 : 36} fill="currentColor" strokeWidth={0} />
      </div>
      {label && <p className="loader__label">{label}</p>}
    </div>
  );
}
