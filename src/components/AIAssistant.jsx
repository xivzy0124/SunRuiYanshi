import { useState, useRef, useEffect } from 'react';

// ─── 工作流模板库 ───
const WORKFLOW_TEMPLATES = {
  '足底压力': {
    name: '足底压力 ETL 流水线',
    nodes: [
      { type: 'input', label: '足底压力 API', x: 100, y: 200, config: { source: 'API', url: '/api/pressure', format: 'JSON' } },
      { type: 'process', label: '数据过滤', x: 300, y: 200, config: { operation: '过滤', expression: '剔除无效帧/空值/异常值' } },
      { type: 'transform', label: '字段映射', x: 500, y: 200, config: { method: '映射', mapping: 'sensor_values → pressure_data' } },
      { type: 'process', label: '特征计算', x: 700, y: 200, config: { operation: '计算', expression: '重心/COP/压强分布/平衡比' } },
      { type: 'output', label: '数据入库', x: 900, y: 200, config: { target: '数据库', url: 't_fusion_health_dataset', format: 'JSON' } },
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
      { type: 'input', label: '足底压力输入', x: 60, y: 120, config: { source: 'API', url: '/api/pressure', format: 'JSON' } },
      { type: 'input', label: '三维姿态输入', x: 60, y: 320, config: { source: 'API', url: '/api/posture', format: 'JSON' } },
      { type: 'process', label: '压力过滤', x: 250, y: 120, config: { operation: '过滤', expression: '无效帧/空值/异常值' } },
      { type: 'process', label: '姿态过滤', x: 250, y: 320, config: { operation: '过滤', expression: '置信度/空值/异常坐标' } },
      { type: 'transform', label: '压力映射', x: 440, y: 120, config: { method: '映射', mapping: 'sensor_values → pressure_data' } },
      { type: 'transform', label: '姿态映射', x: 440, y: 320, config: { method: '映射', mapping: 'landmarks → pose_data' } },
      { type: 'process', label: '压力计算', x: 630, y: 120, config: { operation: '计算', expression: '重心/COP/压强分布' } },
      { type: 'process', label: '姿态计算', x: 630, y: 320, config: { operation: '计算', expression: '关节夹角/步态参数' } },
      { type: 'merge', label: '双流融合 JOIN', x: 820, y: 220, config: { strategy: '并集', key: 'ts (50ms nearest)' } },
      { type: 'output', label: '数据入库', x: 1020, y: 170, config: { target: '数据库', url: 't_fusion_health_dataset' } },
      { type: 'output', label: 'API 发布', x: 1020, y: 280, config: { target: 'API', url: '/api/v1/latest' } },
    ],
    edges: [
      { source: 0, target: 2 },
      { source: 1, target: 3 },
      { source: 2, target: 4 },
      { source: 3, target: 5 },
      { source: 4, target: 6 },
      { source: 5, target: 7 },
      { source: 6, target: 8 },
      { source: 7, target: 8 },
      { source: 8, target: 9 },
      { source: 8, target: 10 },
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

  '双源融合': `✅ 已生成双源融合流水线，共 11 个节点：

**左流（足底压力）**：📥 输入 → ⚙ 过滤 → 🔄 映射 → ⚙ 计算
**右流（三维姿态）**：📥 输入 → ⚙ 过滤 → 🔄 映射 → ⚙ 计算
**融合**：⊕ 双流 JOIN → 📤 数据入库 + 📤 API 发布

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
