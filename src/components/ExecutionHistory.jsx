import { useState } from 'react';

const HISTORY_DATA = [
  {
    id: 'exec-001',
    timestamp: '2024-01-15 14:30:22',
    workflow: '力姿融合流水线',
    status: 'success',
    duration: '2.3s',
    records: 6218,
    nodes: 12,
    details: {
      input: { pressure: 10752, posture: 8144 },
      output: 6218,
      errors: 0,
      warnings: 2,
    },
  },
  {
    id: 'exec-002',
    timestamp: '2024-01-15 14:25:10',
    workflow: '力姿融合流水线',
    status: 'success',
    duration: '2.1s',
    records: 5892,
    nodes: 12,
    details: {
      input: { pressure: 9876, posture: 7654 },
      output: 5892,
      errors: 0,
      warnings: 1,
    },
  },
  {
    id: 'exec-003',
    timestamp: '2024-01-15 14:20:05',
    workflow: '力姿融合流水线',
    status: 'error',
    duration: '0.8s',
    records: 0,
    nodes: 12,
    details: {
      input: { pressure: 0, posture: 0 },
      output: 0,
      errors: 1,
      warnings: 0,
      errorMsg: '数据源连接超时: pressure API 无响应',
    },
  },
  {
    id: 'exec-004',
    timestamp: '2024-01-15 14:15:30',
    workflow: '足底压力 ETL',
    status: 'success',
    duration: '1.2s',
    records: 4523,
    nodes: 8,
    details: {
      input: { pressure: 8765 },
      output: 4523,
      errors: 0,
      warnings: 0,
    },
  },
  {
    id: 'exec-005',
    timestamp: '2024-01-15 14:10:18',
    workflow: '三维姿态 ETL',
    status: 'warning',
    duration: '1.8s',
    records: 3987,
    nodes: 8,
    details: {
      input: { posture: 6543 },
      output: 3987,
      errors: 0,
      warnings: 5,
      warningMsg: '5 条记录置信度低于阈值',
    },
  },
];

export default function ExecutionHistory({ onClose, onRerun }) {
  const [selectedExec, setSelectedExec] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredHistory = HISTORY_DATA.filter(
    (exec) => filterStatus === 'all' || exec.status === filterStatus
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'running':
        return '●';
      default:
        return '?';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return '#34d399';
      case 'error':
        return '#f87171';
      case 'warning':
        return '#fb923c';
      case 'running':
        return '#6c8cff';
      default:
        return '#6b7084';
    }
  };

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>执行历史</h2>
          <p>查看工作流执行记录与结果</p>
          <button className="history-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="history-toolbar">
          <div className="history-filters">
            {['all', 'success', 'error', 'warning'].map((status) => (
              <button
                key={status}
                className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all'
                  ? '全部'
                  : status === 'success'
                    ? '成功'
                    : status === 'error'
                      ? '失败'
                      : '警告'}
              </button>
            ))}
          </div>
        </div>

        <div className="history-content">
          <div className="history-list">
            {filteredHistory.map((exec) => (
              <div
                key={exec.id}
                className={`history-item ${selectedExec?.id === exec.id ? 'selected' : ''} ${exec.status}`}
                onClick={() => setSelectedExec(exec)}
              >
                <div className="history-item-header">
                  <span className="status-icon" style={{ color: getStatusColor(exec.status) }}>
                    {getStatusIcon(exec.status)}
                  </span>
                  <span className="exec-time">{exec.timestamp}</span>
                  <span className="exec-duration">{exec.duration}</span>
                </div>
                <div className="history-item-body">
                  <div className="exec-workflow">{exec.workflow}</div>
                  <div className="exec-meta">
                    <span>{exec.records} 条记录</span>
                    <span>{exec.nodes} 个节点</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedExec && (
            <div className="history-detail">
              <div className="detail-header">
                <h3>执行详情</h3>
                <span className="detail-id">{selectedExec.id}</span>
              </div>

              <div className="detail-section">
                <h4>基本信息</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">工作流</span>
                    <span className="detail-value">{selectedExec.workflow}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">执行时间</span>
                    <span className="detail-value">{selectedExec.timestamp}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">执行耗时</span>
                    <span className="detail-value">{selectedExec.duration}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">处理记录</span>
                    <span className="detail-value">{selectedExec.records}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h4>数据统计</h4>
                <div className="detail-stats">
                  <div className="stat-card">
                    <span className="stat-label">输入</span>
                    <span className="stat-value">
                      {selectedExec.details.input.pressure
                        ? selectedExec.details.input.pressure.toLocaleString()
                        : '-'}
                      {selectedExec.details.input.posture
                        ? ` + ${selectedExec.details.input.posture.toLocaleString()}`
                        : ''}
                    </span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">输出</span>
                    <span className="stat-value accent">
                      {selectedExec.details.output.toLocaleString()}
                    </span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">错误</span>
                    <span
                      className={`stat-value ${selectedExec.details.errors > 0 ? 'error' : ''}`}
                    >
                      {selectedExec.details.errors}
                    </span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">警告</span>
                    <span
                      className={`stat-value ${selectedExec.details.warnings > 0 ? 'warning' : ''}`}
                    >
                      {selectedExec.details.warnings}
                    </span>
                  </div>
                </div>
              </div>

              {selectedExec.details.errorMsg && (
                <div className="detail-section error">
                  <h4>错误信息</h4>
                  <div className="error-message">{selectedExec.details.errorMsg}</div>
                </div>
              )}

              {selectedExec.details.warningMsg && (
                <div className="detail-section warning">
                  <h4>警告信息</h4>
                  <div className="warning-message">{selectedExec.details.warningMsg}</div>
                </div>
              )}

              <div className="detail-actions">
                <button className="action-btn primary" onClick={() => onRerun?.(selectedExec)}>
                  重新执行
                </button>
                <button className="action-btn secondary">查看日志</button>
                <button className="action-btn secondary">导出报告</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
