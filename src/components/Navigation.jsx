import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'monitor', label: '数据监控', icon: '📊', desc: '实时数据采集与监控' },
  { id: 'workflow', label: '工作流编排', icon: '⚡', desc: '可视化工作流设计' },
  { id: 'pipeline', label: '数据血缘', icon: '🔗', desc: 'ETL 流程与血缘图谱' },
];

export default function Navigation({ currentPage, onPageChange, workflowStatus, theme, onToggleTheme }) {
  const [showTooltip, setShowTooltip] = useState(null);

  return (
    <nav className="app-navigation">
      {/* Logo */}
      <div className="nav-logo">
        <div className="logo-icon">🧠</div>
        <div className="logo-text">
          <span className="logo-title">力姿数据融合平台</span>
          <span className="logo-subtitle">AI-Powered ETL Platform</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        {NAV_ITEMS.map((item, index) => (
          <div key={item.id} className="nav-tab-wrapper">
            <button
              className={`nav-tab ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => onPageChange(item.id)}
              onMouseEnter={() => setShowTooltip(item.id)}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <span className="nav-tab-icon">{item.icon}</span>
              <span className="nav-tab-label">{item.label}</span>
              {workflowStatus?.[item.id] && (
                <span className={`nav-tab-status ${workflowStatus[item.id]}`}>
                  {workflowStatus[item.id] === 'running' && '●'}
                  {workflowStatus[item.id] === 'completed' && '✓'}
                  {workflowStatus[item.id] === 'error' && '✕'}
                </span>
              )}
            </button>
            {index < NAV_ITEMS.length - 1 && (
              <div className="nav-connector">
                <div className="connector-line" />
                <div className="connector-arrow">→</div>
              </div>
            )}
            {showTooltip === item.id && (
              <div className="nav-tooltip">
                <div className="tooltip-title">{item.label}</div>
                <div className="tooltip-desc">{item.desc}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right Section */}
      <div className="nav-right">
        <div className="nav-status">
          <span className="status-dot online" />
          <span className="status-text">AI 就绪</span>
        </div>
        <button
          className="nav-btn theme-toggle"
          onClick={onToggleTheme}
          title={theme === 'dark' ? '切换到日间模式' : '切换到夜间模式'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="nav-btn" title="设置">
          ⚙️
        </button>
      </div>
    </nav>
  );
}
