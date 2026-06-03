import { useState, useRef, useEffect } from 'react';

// ─── 工作流模板库 ───
const WORKFLOW_TEMPLATES = {
  '足底压力': {
    name: '足底压力 ETL 流水线',
    nodes: [
      { type: 'input', label: '足底压力 API', x: 100, y: 250, config: { source: 'API', url: '/api/pressure', format: 'JSON' } },
      { type: 'process', label: '数据过滤', x: 400, y: 250, config: { operation: '过滤', expression: '剔除无效帧/空值/异常值' } },
      { type: 'transform', label: '字段映射', x: 700, y: 250, config: { method: '映射', mapping: 'sensor_values → pressure_data' } },
      { type: 'process', label: '特征计算', x: 1000, y: 250, config: { operation: '计算', expression: '重心/COP/压强分布/平衡比' } },
      { type: 'output', label: '数据入库', x: 1300, y: 250, config: { target: '数据库', url: 't_fusion_health_dataset', format: 'JSON' } },
    ],
    edges: [
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 2, target: 3 },
      { source: 3, target: 4 },
    ],
  },

  '双源融合': {
    name: '双源融合流水线',
    nodes: [
      // 足底压力流 (5个节点)
      { type: 'input', label: '足底压力数据', x: 100, y: 120, config: { source: 'API', url: '/api/pressure', format: 'JSON' } },
      { type: 'filter', label: '数据过滤', x: 350, y: 150, config: { field: 'frame_data', operator: '不为空', value: '' } },
      { type: 'transform', label: '字段映射', x: 600, y: 120, config: { method: '映射', mapping: 'sensor_values → pressure_data' } },
      { type: 'process', label: '特征计算', x: 850, y: 160, config: { operation: '计算', expression: '重心/COP/压强分布' } },
      { type: 'aggregate', label: '数据聚合', x: 1100, y: 130, config: { groupField: 'ts', function: 'AVG', valueField: 'pressure_data' } },

      // 三维姿态流 (5个节点)
      { type: 'input', label: '三维姿态数据', x: 150, y: 350, config: { source: 'API', url: '/api/posture', format: 'JSON' } },
      { type: 'filter', label: '数据过滤', x: 400, y: 380, config: { field: 'confidence', operator: '大于', value: '0.8' } },
      { type: 'transform', label: '字段映射', x: 650, y: 340, config: { method: '映射', mapping: 'landmarks → pose_data' } },
      { type: 'process', label: '特征提取', x: 900, y: 390, config: { operation: '计算', expression: '步频/步幅/对称性' } },
      { type: 'validate', label: '质量检查', x: 1150, y: 350, config: { rules: '动作完整性/时间连续性', onError: '记录' } },

      // 合并处理 (4个节点)
      { type: 'merge', label: '双流融合 JOIN', x: 1450, y: 240, config: { strategy: '左连接', key: 'ts (50ms nearest)' } },
      { type: 'code', label: '特征工程', x: 1700, y: 270, config: { language: 'Python', code: '# 交叉特征/时序特征\nfeatures = engineer(pressure, pose)', timeout: 60 } },
      { type: 'process', label: '数据增强', x: 1950, y: 240, config: { operation: '计算', expression: '缺失值插补/异常修复' } },
      { type: 'validate', label: '质量检查', x: 2200, y: 280, config: { rules: '关联完整性/一致性校验', onError: '停止' } },

      // 输出阶段 (3个节点)
      { type: 'output', label: '数据入库', x: 2500, y: 200, config: { target: '数据库', url: 't_fusion_health_dataset' } },
      { type: 'output', label: 'API 发布', x: 2500, y: 320, config: { target: 'API', url: '/api/v1/latest' } },
      { type: 'log', label: '监控告警', x: 2750, y: 260, config: { level: 'INFO', message: '延迟/吞吐量/异常检测', output: '远程' } },
    ],
    edges: [
      // 足底压力流连线 (4条)
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 2, target: 3 },
      { source: 3, target: 4 },

      // 三维姿态流连线 (4条)
      { source: 5, target: 6 },
      { source: 6, target: 7 },
      { source: 7, target: 8 },
      { source: 8, target: 9 },

      // 合并处理连线 (4条)
      { source: 4, target: 10 },
      { source: 9, target: 10 },
      { source: 10, target: 11 },
      { source: 11, target: 12 },
      { source: 12, target: 13 },

      // 输出阶段连线 (3条)
      { source: 13, target: 14 },
      { source: 13, target: 15 },
      { source: 14, target: 16 },
      { source: 15, target: 16 },
    ],
  },

  '异常检测': {
    name: '异常检测节点',
    nodes: [
      { type: 'condition', label: '异常检测', x: 0, y: 0, config: { field: 'pressure_data', operator: '正则', value: '阈值 [0, 3000]' } },
    ],
    edges: [],
  },

  '缓存优化': {
    name: '缓存优化节点',
    nodes: [
      { type: 'process', label: '缓存层', x: 0, y: 0, config: { operation: '聚合', expression: 'Redis 缓存热数据，TTL=60s' } },
    ],
    edges: [],
  },
};

// ─── AI 响应文本 ───
const AI_TEXTS = {
  '足底压力': `✅ 已生成足底压力 ETL 流水线，共 5 个节点：

📥 **足底压力 API** → ⚙ **数据过滤** → 🔄 **字段映射** → ⚙ **特征计算** → 📤 **数据入库**

节点已注入到工作流编辑器画布，可点击节点查看详细配置。`,

  '双源融合': `✅ 已生成双源融合流水线，共 17 个节点：

**左流（足底压力）**：📥 输入 → 🔍 过滤 → 🔄 映射 → ⚙ 计算 → 📊 聚合
**右流（三维姿态）**：📥 输入 → 🔍 过滤 → 🔄 映射 → ⚙ 特征 → ✓ 质量
**融合**：⊕ 双流 JOIN → ⟨/⟩ 特征工程 → ⚙ 增强 → ✓ 质量
**输出**：📤 入库 + 📤 API + 📝 监控

节点已注入到编辑器画布，双流并行处理后汇聚融合。`,

  '异常检测': `✅ 已在工作流中追加异常检测节点：

❖ **异常检测** — 检测规则：
- 压力值超出阈值 [0, 3000]
- 姿态角度异常 (头前倾 > 15°)
- 数据缺失率 > 10%

请在编辑器中将此节点连接到合适的位置。`,

  '缓存优化': `✅ 已添加缓存优化节点：

⚙ **缓存层** — 优化方案：
- Redis 缓存热数据，TTL=60s
- 批量处理替代逐条处理
- 预期延迟降低 40%

请在编辑器中将此节点连接到数据过滤之后。`,
};

// ─── 通用分析响应 ───
function getGenericResponse(input) {
  if (input.includes('过滤') || input.includes('清洗')) {
    return WORKFLOW_TEMPLATES['足底压力'];
  }
  if (input.includes('融合') || input.includes('合并') || input.includes('JOIN')) {
    return WORKFLOW_TEMPLATES['双源融合'];
  }
  if (input.includes('异常') || input.includes('检测') || input.includes('告警')) {
    return WORKFLOW_TEMPLATES['异常检测'];
  }
  if (input.includes('优化') || input.includes('性能') || input.includes('缓存')) {
    return WORKFLOW_TEMPLATES['缓存优化'];
  }
  return null;
}

function getGenericText(input) {
  if (input.includes('过滤') || input.includes('清洗')) {
    return AI_TEXTS['足底压力'];
  }
  if (input.includes('融合') || input.includes('合并') || input.includes('JOIN')) {
    return AI_TEXTS['双源融合'];
  }
  if (input.includes('异常') || input.includes('检测') || input.includes('告警')) {
    return AI_TEXTS['异常检测'];
  }
  if (input.includes('优化') || input.includes('性能') || input.includes('缓存')) {
    return AI_TEXTS['缓存优化'];
  }
  return null;
}

// ─── 关键词匹配 ───
function matchTemplate(input) {
  // 精确匹配预设指令
  for (const key of Object.keys(AI_TEXTS)) {
    if (input.includes(key)) return key;
  }
  // 通用语义匹配
  if (input.includes('生成') && (input.includes('流水线') || input.includes('工作流') || input.includes('ETL'))) {
    if (input.includes('压力') || input.includes('足底')) return '足底压力';
    return '双源融合';
  }
  if (input.includes('添加') || input.includes('追加') || input.includes('新增')) {
    if (input.includes('异常') || input.includes('检测')) return '异常检测';
    if (input.includes('缓存') || input.includes('优化')) return '缓存优化';
    if (input.includes('过滤')) return '足底压力';
  }
  return null;
}

const SUGGESTIONS = [
  '生成足底压力 ETL 流水线',
  '生成双源融合流水线',
  '添加异常检测节点',
  '优化数据融合性能',
];

export default function AIAssistant({ onWorkflowGenerated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '你好！我是 AI 编排助手。告诉我你想要什么，我会自动生成工作流并注入到编辑器画布中。\n\n试试输入："生成双源融合流水线"',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    setTimeout(() => {
      const templateKey = matchTemplate(userMessage);
      const template = templateKey ? WORKFLOW_TEMPLATES[templateKey] : getGenericResponse(userMessage);
      const text = templateKey ? AI_TEXTS[templateKey] : getGenericText(userMessage);

      const response = text || `收到指令："${userMessage}"

正在分析需求...

**分析结果**：
- 数据源：足底压力 + 三维姿态
- 处理逻辑：过滤 → 映射 → 计算 → 融合
- 输出：标准化数据集 + API

试试输入更具体的指令，如"生成双源融合流水线"`;

      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);

      // 如果匹配到工作流模板，触发注入回调
      if (template) {
        setTimeout(() => {
          onWorkflowGenerated?.(template);
        }, 500);
      }
    }, 800);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    // 直接发送
    setMessages((prev) => [...prev, { role: 'user', content: suggestion }]);
    setIsTyping(true);

    setTimeout(() => {
      const templateKey = matchTemplate(suggestion);
      const template = templateKey ? WORKFLOW_TEMPLATES[templateKey] : null;
      const text = templateKey ? AI_TEXTS[templateKey] : `收到指令："${suggestion}"`;

      setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
      setIsTyping(false);

      if (template) {
        setTimeout(() => {
          onWorkflowGenerated?.(template);
        }, 500);
      }
    }, 800);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className={`ai-assistant-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="AI 助手"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Assistant Panel */}
      {isOpen && (
        <div className="ai-assistant-panel">
          <div className="ai-panel-header">
            <div className="ai-header-info">
              <span className="ai-avatar">🤖</span>
              <div>
                <div className="ai-name">AI 编排助手</div>
                <div className="ai-status">
                  <span className="status-dot online" />
                  可生成工作流并注入编辑器
                </div>
              </div>
            </div>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="ai-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`ai-message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {isTyping && (
              <div className="ai-message assistant">
                <div className="message-content typing">
                  <span className="typing-dot">●</span>
                  <span className="typing-dot">●</span>
                  <span className="typing-dot">●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ai-suggestions">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                className="suggestion-btn"
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={isTyping}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="ai-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入指令，如：生成双源融合流水线"
              disabled={isTyping}
            />
            <button className="send-btn" onClick={handleSend} disabled={isTyping || !input.trim()}>
              发送
            </button>
          </div>
        </div>
      )}
    </>
  );
}
