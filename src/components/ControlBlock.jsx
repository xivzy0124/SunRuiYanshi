import { useState } from 'react';

export default function ControlBlock({ type, icon, name, desc, code }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`ctrl-block type-${type}`}
      onClick={() => setExpanded(!expanded)}
    >
      <span className="ctrl-icon">{icon}</span>
      <span className="ctrl-name">{name}</span>
      <span className="ctrl-expand">点击展开代码 ↓</span>
      <div className="ctrl-desc">{desc}</div>
      {expanded && (
        <div
          className="ctrl-code active"
          dangerouslySetInnerHTML={{ __html: code }}
        />
      )}
    </div>
  );
}
