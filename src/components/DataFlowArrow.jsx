export default function DataFlowArrow({ color }) {
  const resolvedColor = color || getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();
  return (
    <div className="data-flow-arrow">
      <svg width="24" height="16">
        <path d="M0 8h16m0 0l-4-3.5m4 3.5l-4 3.5" stroke={resolvedColor} strokeWidth="1.5" fill="none" />
      </svg>
      <span className="flow-dot" style={{ background: resolvedColor, animationDelay: '0s' }} />
      <span className="flow-dot" style={{ background: resolvedColor, animationDelay: '0.4s' }} />
      <span className="flow-dot" style={{ background: resolvedColor, animationDelay: '0.8s' }} />
    </div>
  );
}
