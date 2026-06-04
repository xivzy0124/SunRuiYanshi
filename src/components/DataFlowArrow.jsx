export default function DataFlowArrow({ color }) {
  const resolvedColor = color || '#94a3b8';
  return (
    <div className="data-flow-arrow">
      <svg width="32" height="20" viewBox="0 0 32 20">
        <path
          d="M0 10h20m0 0l-5-4m5 4l-5 4"
          stroke={resolvedColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      </svg>
      <span className="flow-dot" style={{ background: resolvedColor, animationDelay: '0s' }} />
      <span className="flow-dot" style={{ background: resolvedColor, animationDelay: '0.4s' }} />
      <span className="flow-dot" style={{ background: resolvedColor, animationDelay: '0.8s' }} />
    </div>
  );
}
