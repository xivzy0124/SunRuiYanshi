export default function MergeIndicator() {
  return (
    <div className="merge-indicator">
      <div className="merge-svg-wrap">
        <svg width="100%" height="32">
          <line x1="93%" y1="0" x2="93%" y2="16" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4" />
          <line x1="93%" y1="16" x2="93%" y2="32" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4" />
          <circle cx="93%" cy="16" r="4" fill="#34d399" />
          <line x1="93%" y1="16" x2="100%" y2="16" stroke="#34d399" strokeWidth="1.5" />
          <polygon points="97,12 100,16 97,20" fill="#34d399" transform="translate(1,0)" />
        </svg>
      </div>
    </div>
  );
}
