import { useState } from 'react';

const TEMPLATES = [
  {
    id: 'pressure-etl',
    name: '足底压力 ETL',
    desc: '足底压力数据采集、清洗、计算的标准流水线',
    icon: '🦶',
    category: '标准模板',
    nodes: 8,
    tags: ['压力', 'ETL', '标准'],
  },
  {
    id: 'posture-etl',
    name: '三维姿态 ETL',
    desc: '三维姿态数据处理与特征提取流水线',
    icon: '🏃',
    category: '标准模板',
    nodes: 8,
    tags: ['姿态', 'ETL', '标准'],
  },
  {
    id: 'fusion-pipeline',
    name: '力姿融合流水线',
    desc: '足底压力与三维姿态数据融合处理',
    icon: '🔄',
    category: '高级模板',
    nodes: 12,
    tags: ['融合', '高级', '推荐'],
  },
  {
    id: 'anomaly-detection',
    name: '异常检测流水线',
    desc: '实时数据异常检测与告警',
    icon: '⚠️',
    category: '高级模板',
    nodes: 6,
    tags: ['异常检测', '告警'],
  },
  {
    id: 'batch-processing',
    name: '批量处理流水线',
    desc: '大批量数据离线处理与分析',
    icon: '📦',
    category: '性能优化',
    nodes: 10,
    tags: ['批量', '性能', '离线'],
  },
  {
    id: 'real-time-monitor',
    name: '实时监控流水线',
    desc: '实时数据流监控与可视化',
    icon: '📈',
    category: '监控模板',
    nodes: 7,
    tags: ['实时', '监控', '可视化'],
  },
];

export default function WorkflowTemplate({ onApplyTemplate, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', '标准模板', '高级模板', '性能优化', '监控模板'];

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="template-overlay" onClick={onClose}>
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-header">
          <h2>工作流模板库</h2>
          <p>选择预置模板快速创建工作流</p>
          <button className="template-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="template-toolbar">
          <div className="template-search">
            <input
              type="text"
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="template-categories">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? '全部' : category}
              </button>
            ))}
          </div>
        </div>

        <div className="template-grid">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-card-header">
                <span className="template-icon">{template.icon}</span>
                <span className="template-category">{template.category}</span>
              </div>
              <h3 className="template-name">{template.name}</h3>
              <p className="template-desc">{template.desc}</p>
              <div className="template-meta">
                <span className="meta-item">
                  <span className="meta-icon">⬡</span>
                  {template.nodes} 个节点
                </span>
              </div>
              <div className="template-tags">
                {template.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <button className="template-apply-btn" onClick={() => onApplyTemplate(template)}>
                使用此模板
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
