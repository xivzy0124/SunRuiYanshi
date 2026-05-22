export default function SectionTitle({ color, children, hint }) {
  return (
    <div className="section-title">
      <span className="dot" style={{ background: color }} />
      {children}
      {hint && <span className="section-hint">{hint}</span>}
    </div>
  );
}
