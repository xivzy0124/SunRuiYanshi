export default function Header({ onBack }) {
  return (
    <header className="etl-header">
      {onBack && (
        <button className="back-btn" onClick={onBack}>
          ← 返回
        </button>
      )}
      <div className="logo">RC</div>
      <h1>数据治理流水线</h1>
    </header>
  );
}
