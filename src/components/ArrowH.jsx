export default function ArrowH({ color }) {
  const resolvedColor = color || getComputedStyle(document.documentElement).getPropertyValue('--muted').trim();
  return (
    <div className="arrow-h">
      <svg width="28" height="16">
        <path d="M0 8h20m0 0l-5-4m5 4l-5 4" stroke={resolvedColor} strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}
