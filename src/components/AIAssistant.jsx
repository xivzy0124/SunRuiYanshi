import { useState, useRef, useEffect } from 'react';

const SUGGESTIONS = [
  '生成足底压力 ETL 流水线',
  '优化数据融合性能',
  '添加异常检测节点',
  '查看执行历史记录',
];

const AI_RESPONSES = {
  '生成足底压力 ETL 流水线': `收到指令，我已为您生成足底压力 ETL 流水线：

**数据源配置**：
- 输入：足底压力 API (18区传感器)
- 采样率：30Hz
- 数据格式：JSON

**处理节点**：
1. 数据过滤：剔除无效帧、空值、异常值
2. 字段映射：sensor_values → pressure_data
3. 字段计算：重心、COP、压强分布、左右平衡

**输出配置**：
- 数据库：t_fusion_health_dataset
- API：/api/v1/pressure

点击"工作流编排"查看详细配置。`,

  优化数据融合性能: `性能优化建议：

**当前瓶颈**：
- JOIN 操作耗时 124ms
- 数据传输延迟

**优化方案**：
1. 增加缓存层，减少重复计算
2. 使用批量处理替代逐条处理
3. 优化 JOIN 算法，使用时间窗口索引

**预期效果**：
- 处理延迟降低 40%
- 吞吐量提升 2.5 倍

是否应用优化方案？`,

  添加异常检测节点: `已添加异常检测节点：

**检测规则**：
1. 压力值超出阈值 [0, 3000]
2. 姿态角度异常 (头前倾 > 15°)
3. 数据缺失率 > 10%

**处理逻辑**：
- 异常数据标记并隔离
- 触发告警通知
- 记录异常日志

**节点位置**：
- 在"数据过滤"后添加
- 连接到"字段映射"节点

查看工作流编辑器确认配置。`,

  查看执行历史记录: `最近执行记录：

**2024-01-15 14:30:22**
- 状态：✓ 成功
- 处理：6,218 条记录
- 耗时：2.3 秒

**2024-01-15 14:25:10**
- 状态：✓ 成功
- 处理：5,892 条记录
- 耗时：2.1 秒

**2024-01-15 14:20:05**
- 状态：✕ 失败
- 错误：数据源连接超时
- 已自动重试

是否查看详细日志？`,
};

export default function AIAssistant({
  onGenerateWorkflow,
  onApplyOptimization: _onApplyOptimization,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '你好！我是 AI 助手，可以帮你进行 ETL 编排、性能优化、异常检测等工作。请问有什么可以帮您？',
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

    // 模拟 AI 响应
    setIsTyping(true);
    setTimeout(() => {
      const response =
        AI_RESPONSES[userMessage] ||
        `收到您的指令："${userMessage}"

我正在分析需求，请稍候...

**分析结果**：
- 数据源：足底压力 + 三维姿态
- 处理逻辑：过滤 → 映射 → 计算 → 融合
- 输出：标准化数据集 + API

是否生成对应的工作流？`;

      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);

      // 如果是生成工作流的指令，触发回调
      if (userMessage.includes('生成') && userMessage.includes('流水线')) {
        onGenerateWorkflow?.();
      }
    }, 1000);
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    handleSend();
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
                <div className="ai-name">AI 助手</div>
                <div className="ai-status">
                  <span className="status-dot online" />
                  智能编排就绪
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
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入指令，如：生成足底压力 ETL 流水线"
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
