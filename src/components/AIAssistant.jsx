import { useState, useRef, useEffect } from 'react';
import { RobotOutlined, CloseOutlined, AudioOutlined } from '@ant-design/icons';

// ─── 语音识别目标文案（10 秒内逐字"识别"浮现）───
const VOICE_TARGET_TEXT =
  '请帮我完成当前足底压力与人体姿态数据的清洗规整、字段标准化，按毫秒级时间戳完成时序融合，最终实现数据入库、API 接口发布，并自动生成完整数据血缘关系。';
const VOICE_DURATION_MS = 10000;

// ─── 工作流模板库 ───
const WORKFLOW_TEMPLATES = {
  '足底压力': {
    name: '足底压力 ETL 流水线',
    nodes: [
      { type: 'input', label: '足底压力 API', x: 100, y: 250, config: { source: 'API', url: '/api/pressure', format: 'JSON' } },
      { type: 'process', label: '数据过滤', x: 400, y: 250, config: { operation: '过滤', expression: '剔除无效帧/空值/异常值' } },
      { type: 'transform', label: '字段标准化', x: 700, y: 250, config: { method: '映射', mapping: 'sensor_values → pressure_data' } },
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
      // 足底压力流 (4个节点) - 上方，对称布局
      { type: 'input', label: '足底压力', x: 100, y: 100, config: { source: 'API', url: '/api/pressure', format: 'JSON' } },
      { type: 'filter', label: '数据清洗', x: 400, y: 100, config: { field: 'frame_data', operator: '不为空', value: '' } },
      { type: 'transform', label: '字段标准化', x: 700, y: 100, config: { method: '映射', mapping: 'sensor_values → pressure_data' } },
      { type: 'process', label: '特征计算', x: 1000, y: 100, config: { operation: '计算', expression: '重心/COP/压强分布' } },

      // 三维姿态流 (4个节点) - 下方，对称布局
      { type: 'input', label: '三维姿态', x: 100, y: 350, config: { source: 'API', url: '/api/posture', format: 'JSON' } },
      { type: 'filter', label: '数据清洗', x: 400, y: 350, config: { field: 'confidence', operator: '大于', value: '0.8' } },
      { type: 'transform', label: '字段标准化', x: 700, y: 350, config: { method: '映射', mapping: 'landmarks → pose_data' } },
      { type: 'process', label: '特征提取', x: 1000, y: 350, config: { operation: '计算', expression: '步频/步幅/对称性' } },

      // 合并处理 (2个节点) - 中间
      { type: 'merge', label: '双流融合', x: 1350, y: 220, config: { strategy: '左连接', key: 'ts (50ms nearest)' } },
      { type: 'validate', label: '质量检查', x: 1650, y: 220, config: { rules: '关联完整性/一致性校验', onError: '停止' } },

      // 输出阶段 (2个节点) - 右侧
      { type: 'output', label: '数据入库', x: 2000, y: 100, config: { target: '数据库', url: 't_fusion_health_dataset' } },
      { type: 'output', label: 'API 发布', x: 2000, y: 350, config: { target: 'API', url: '/api/v1/latest' } },
    ],
    edges: [
      // 足底压力流连线 (3条)
      { source: 0, target: 1 },
      { source: 1, target: 2 },
      { source: 2, target: 3 },

      // 三维姿态流连线 (3条)
      { source: 4, target: 5 },
      { source: 5, target: 6 },
      { source: 6, target: 7 },

      // 合并处理连线 (3条)
      { source: 3, target: 8 },
      { source: 7, target: 8 },
      { source: 8, target: 9 },

      // 输出阶段连线 (2条)
      { source: 9, target: 10 },
      { source: 9, target: 11 },
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

📥 **足底压力 API** → ⚙ **数据过滤** → 🔄 **字段标准化** → ⚙ **特征计算** → 📤 **数据入库**

节点已注入到工作流编辑器画布，可点击节点查看详细配置。`,

  '双源融合': `✅ 已生成双源融合流水线，共 12 个节点：

**左流（足底压力）**：📥 输入 → 🔍 清洗 → 🔄 标准化 → ⚙ 计算
**右流（三维姿态）**：📥 输入 → 🔍 清洗 → 🔄 标准化 → ⚙ 特征
**融合**：⊕ 双流融合 → ✓ 质量检查
**输出**：📤 数据入库 + 📤 API 发布

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
// 演示模式：无论输入什么，统一生成「双源融合流水线」，跳转到同一条链路
function matchTemplate() {
  return '双源融合';
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
  // 语音识别（现场输入）状态
  const [isListening, setIsListening] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0); // 0~1，用于倒计时/波形强度
  const voiceTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 组件卸载时清理语音定时器
  useEffect(() => () => clearInterval(voiceTimerRef.current), []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 统一发送逻辑（手动输入 / 语音识别共用）
  const sendMessage = (rawText) => {
    const userMessage = rawText.trim();
    if (!userMessage) return;

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
- 处理逻辑：清洗 → 标准化 → 时序融合 → 入库/API
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

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
  };

  // ─── 现场语音输入：点击小球 → 波动 → 10 秒内逐字"识别"文案 → 自动发送 ───
  const handleVoiceInput = () => {
    if (isListening || isTyping) return;

    setIsListening(true);
    setVoiceProgress(0);
    setInput('');

    const start = Date.now();
    const total = VOICE_TARGET_TEXT.length;

    voiceTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / VOICE_DURATION_MS, 1);
      setVoiceProgress(progress);

      // 按时间进度逐字浮现，模拟实时语音转写
      const charCount = Math.floor(progress * total);
      setInput(VOICE_TARGET_TEXT.slice(0, charCount));

      if (progress >= 1) {
        clearInterval(voiceTimerRef.current);
        setInput(VOICE_TARGET_TEXT);
        setIsListening(false);
        setVoiceProgress(0);
        // 识别完成后自动发送
        sendMessage(VOICE_TARGET_TEXT);
      }
    }, 80);
  };

  const handleStopVoice = () => {
    clearInterval(voiceTimerRef.current);
    setIsListening(false);
    setVoiceProgress(0);
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
        {isOpen ? <CloseOutlined /> : <RobotOutlined />}
      </button>

      {/* Assistant Panel */}
      {isOpen && (
        <div className="ai-assistant-panel">
          <div className="ai-panel-header">
            <div className="ai-header-info">
              <span className="ai-avatar"><RobotOutlined /></span>
              <div>
                <div className="ai-name">AI 编排助手</div>
                <div className="ai-status">
                  <span className="status-dot online" />
                  可生成工作流并注入编辑器
                </div>
              </div>
            </div>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
              <CloseOutlined />
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

          {/* 现场语音识别浮层：小球 + 波动 + 倒计时 */}
          {isListening && (
            <div className="ai-voice-overlay" onClick={handleStopVoice}>
              <div className="voice-ball-wrap">
                <span className="voice-ripple" />
                <span className="voice-ripple" />
                <span className="voice-ripple" />
                <span className="voice-ball">
                  <AudioOutlined />
                </span>
              </div>
              <div className="voice-status">正在聆听并识别…</div>
              <div className="voice-countdown">
                {Math.ceil((1 - voiceProgress) * (VOICE_DURATION_MS / 1000))} 秒
              </div>
              <div className="voice-hint">点击任意处停止</div>
            </div>
          )}

          <div className="ai-input-area">
            <button
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={isListening ? handleStopVoice : handleVoiceInput}
              disabled={isTyping}
              title="现场语音输入"
            >
              <AudioOutlined />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? '识别中…' : '输入指令，如：生成双源融合流水线'}
              disabled={isTyping || isListening}
            />
            <button className="send-btn" onClick={handleSend} disabled={isTyping || isListening || !input.trim()}>
              发送
            </button>
          </div>
        </div>
      )}
    </>
  );
}
