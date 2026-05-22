import { useState } from 'react';
import { processDetails as detailData } from '../data/detailData';

export default function DetailPanel({ activeId, onClose }) {
  const [editing, setEditing] = useState(false);
  const [codeValues, setCodeValues] = useState({});
  const [activeTab, setActiveTab] = useState('json');

  if (!activeId || !detailData[activeId]) return null;

  const detail = detailData[activeId];

  const handleCodeChange = (index, value) => {
    setCodeValues(prev => ({ ...prev, [index]: value }));
  };

  const stripHtml = (html) => {
    return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  };

  const stripCodeHtml = (html) => {
    return html.replace(/<[^>]+>/g, '');
  };

  const getJsonFromCode = (codeHtml) => {
    const raw = stripCodeHtml(codeHtml);
    return raw;
  };

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="detail-modal-header">
          <div className="detail-modal-title">
            <span className="detail-modal-icon">
              {detail.blocks[0]?.icon || '◆'}
            </span>
            <h3>{detail.title}</h3>
          </div>
          <div className="detail-modal-actions">
            <button
              className={`detail-edit-btn ${editing ? 'active' : ''}`}
              onClick={() => setEditing(!editing)}
            >
              {editing ? '✓ 完成编辑' : '✎ 编辑配置'}
            </button>
            <button className="detail-close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Body: split left/right */}
        <div className="detail-modal-body">
          {/* Left: Info */}
          <div className="detail-info-panel">
            <div className="detail-info-section">
              <h4>概述</h4>
              <p>{stripHtml(detail.body)}</p>
            </div>

            {detail.blocks.map((block, i) => (
              <div key={i} className="detail-info-section">
                <div className="detail-info-block-header">
                  <span className={`detail-block-icon type-${block.type}`}>
                    {block.icon}
                  </span>
                  <div>
                    <div className="detail-block-name">{block.name}</div>
                    <div className="detail-block-desc">{block.desc}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Stats */}
            <div className="detail-info-section">
              <h4>执行统计</h4>
              <div className="detail-stats">
                <div className="detail-stat">
                  <span className="detail-stat-label">输入记录</span>
                  <span className="detail-stat-value">
                    {activeId.includes('pressure-input') ? '10,752' :
                     activeId.includes('posture-input') ? '8,144' :
                     activeId.includes('pressure-filter') ? '10,752' :
                     activeId.includes('posture-filter') ? '8,144' :
                     activeId.includes('pressure-map') ? '9,238' :
                     activeId.includes('posture-map') ? '6,947' :
                     activeId.includes('pressure-calc') ? '9,107' :
                     activeId.includes('posture-calc') ? '6,835' :
                     activeId === 'join' ? '9,107 + 6,835' :
                     activeId === 'db' ? '6,218' :
                     activeId === 'api' ? '6,218' : '—'}
                  </span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-label">输出记录</span>
                  <span className="detail-stat-value accent">
                    {activeId.includes('pressure-input') ? '10,752' :
                     activeId.includes('posture-input') ? '8,144' :
                     activeId.includes('pressure-filter') ? '9,238' :
                     activeId.includes('posture-filter') ? '6,947' :
                     activeId.includes('pressure-map') ? '9,107' :
                     activeId.includes('posture-map') ? '6,835' :
                     activeId.includes('pressure-calc') ? '9,107' :
                     activeId.includes('posture-calc') ? '6,835' :
                     activeId === 'join' ? '6,218' :
                     activeId === 'db' ? '6,218' :
                     activeId === 'api' ? '6,218' : '—'}
                  </span>
                </div>
                <div className="detail-stat">
                  <span className="detail-stat-label">执行耗时</span>
                  <span className="detail-stat-value">
                    {activeId.includes('input') ? '12ms' :
                     activeId.includes('filter') ? '45ms' :
                     activeId.includes('map') ? '38ms' :
                     activeId.includes('calc') ? '67ms' :
                     activeId === 'join' ? '124ms' :
                     activeId === 'db' ? '89ms' :
                     activeId === 'api' ? '156ms' : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Code */}
          <div className="detail-code-panel">
            {/* Tabs */}
            <div className="detail-code-tabs">
              <button
                className={`detail-tab ${activeTab === 'json' ? 'active' : ''}`}
                onClick={() => setActiveTab('json')}
              >
                {'{ }'} JSON 配置
              </button>
              <button
                className={`detail-tab ${activeTab === 'python' ? 'active' : ''}`}
                onClick={() => setActiveTab('python')}
              >
                <span style={{ color: '#3572A5' }}>Py</span> Python 代码
              </button>
              {editing && <span className="detail-code-editing-badge">可编辑</span>}
            </div>

            {/* Tab Content */}
            <div className="detail-code-body">
              {activeTab === 'json' ? (
                /* JSON View */
                detail.blocks.map((block, i) => (
                  <div key={i} className="detail-code-block">
                    <div className="detail-code-block-title">
                      <span className={`detail-code-block-icon type-${block.type}`}>
                        {block.icon}
                      </span>
                      {block.name}
                    </div>
                    {editing ? (
                      <textarea
                        className="detail-code-editor"
                        value={codeValues[`json-${i}`] ?? getJsonFromCode(block.code)}
                        onChange={(e) => handleCodeChange(`json-${i}`, e.target.value)}
                        spellCheck={false}
                      />
                    ) : (
                      <pre
                        className="detail-code-display"
                        dangerouslySetInnerHTML={{ __html: block.code }}
                      />
                    )}
                  </div>
                ))
              ) : (
                /* Python View */
                <div className="detail-code-block">
                  <div className="detail-code-block-title">
                    <span className="detail-code-block-icon type-transform">Py</span>
                    ETL Pipeline — {detail.title}
                  </div>
                  {editing ? (
                    <textarea
                      className="detail-code-editor detail-code-editor-full"
                      value={codeValues['python'] ?? generatePython(detail, activeId)}
                      onChange={(e) => handleCodeChange('python', e.target.value)}
                      spellCheck={false}
                    />
                  ) : (
                    <pre className="detail-code-display detail-code-display-full">
                      {generatePython(detail, activeId)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function generatePython(detail, activeId) {
  const block = detail.blocks[0];
  if (!block) return '# No configuration available';

  const desc = block.desc;

  return `# -*- coding: utf-8 -*-
"""
${detail.title}
${desc}
"""

import pandas as pd
from restcloud.etl import Pipeline, Node

# 节点配置
config = {
    "node_id": "${activeId}",
    "node_name": "${detail.title}",
    "type": "${block.type}",
}

# 初始化节点
node = Node(
    name="${detail.title}",
    node_type="${block.type}",
    config=config,
)

# 执行逻辑
def execute(input_data: pd.DataFrame) -> pd.DataFrame:
    """
    ${desc}
    """
    # TODO: 在此添加自定义处理逻辑
    result = input_data.copy()

    # 数据校验
    assert len(result) > 0, "输入数据为空"

    return result


if __name__ == "__main__":
    # 测试运行
    test_data = pd.DataFrame()
    output = execute(test_data)
    print(f"输出 {len(output)} 条记录")
`;
}
