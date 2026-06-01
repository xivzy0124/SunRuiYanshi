import { useState } from 'react';

// 节点配置定义
const NODE_CONFIGS = {
  start: [
    {
      key: 'trigger',
      label: '触发方式',
      type: 'select',
      options: ['手动', '定时', '事件'],
      default: '手动',
    },
    { key: 'description', label: '描述', type: 'text', default: '' },
  ],
  end: [
    {
      key: 'action',
      label: '结束动作',
      type: 'select',
      options: ['保存', '通知', '导出'],
      default: '保存',
    },
    {
      key: 'notify',
      label: '通知方式',
      type: 'select',
      options: ['无', '邮件', '钉钉', '企微'],
      default: '无',
    },
  ],
  process: [
    {
      key: 'operation',
      label: '处理操作',
      type: 'select',
      options: ['过滤', '聚合', '计算', '排序'],
      default: '过滤',
    },
    { key: 'expression', label: '表达式', type: 'text', default: '' },
    { key: 'timeout', label: '超时(秒)', type: 'number', default: 30 },
  ],
  condition: [
    { key: 'field', label: '判断字段', type: 'text', default: '' },
    {
      key: 'operator',
      label: '运算符',
      type: 'select',
      options: ['等于', '大于', '小于', '包含', '正则'],
      default: '等于',
    },
    { key: 'value', label: '比较值', type: 'text', default: '' },
  ],
  input: [
    {
      key: 'source',
      label: '数据源',
      type: 'select',
      options: ['API', '数据库', '文件', '消息队列'],
      default: 'API',
    },
    { key: 'url', label: '地址/路径', type: 'text', default: '' },
    {
      key: 'format',
      label: '数据格式',
      type: 'select',
      options: ['JSON', 'CSV', 'XML', 'Parquet'],
      default: 'JSON',
    },
  ],
  output: [
    {
      key: 'target',
      label: '输出目标',
      type: 'select',
      options: ['API', '数据库', '文件', '消息队列'],
      default: 'API',
    },
    { key: 'url', label: '地址/路径', type: 'text', default: '' },
    {
      key: 'format',
      label: '数据格式',
      type: 'select',
      options: ['JSON', 'CSV', 'XML', 'Parquet'],
      default: 'JSON',
    },
  ],
  transform: [
    {
      key: 'method',
      label: '转换方式',
      type: 'select',
      options: ['映射', '合并', '拆分', '编码'],
      default: '映射',
    },
    { key: 'mapping', label: '映射规则', type: 'text', default: '' },
  ],
  merge: [
    {
      key: 'strategy',
      label: '合并策略',
      type: 'select',
      options: ['并集', '交集', '左连接', '右连接'],
      default: '并集',
    },
    { key: 'key', label: '合并键', type: 'text', default: '' },
  ],
};

export default function WorkflowNode({
  node,
  nodeType,
  selected,
  onDragStart,
  onPortMouseDown,
  onDelete,
  onConfigChange,
}) {
  const [showConfig, setShowConfig] = useState(false);
  const configs = NODE_CONFIGS[node.type] || [];
  const nodeConfig = node.config || {};

  const handleConfigChange = (key, value) => {
    onConfigChange?.(node.id, { ...nodeConfig, [key]: value });
  };

  return (
    <div
      className={`workflow-node ${selected ? 'selected' : ''}`}
      data-node-id={node.id}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        borderColor: selected ? nodeType.color : undefined,
        minWidth: showConfig ? '240px' : '180px',
      }}
      onMouseDown={onDragStart}
    >
      {/* 节点头部 */}
      <div className="node-header" style={{ background: `${nodeType.color}15` }}>
        <div
          className="node-icon"
          style={{
            background: `${nodeType.color}25`,
            color: nodeType.color,
          }}
        >
          {nodeType.icon}
        </div>
        <span className="node-label">{node.label}</span>
        <button
          className="node-config-btn"
          onClick={(e) => {
            e.stopPropagation();
            setShowConfig(!showConfig);
          }}
          title="配置"
        >
          ⚙
        </button>
        <button
          className="node-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="删除节点"
        >
          ✕
        </button>
      </div>

      {/* 节点内容 */}
      <div className="node-body">
        <div className="node-desc">{nodeType.desc}</div>
        {/* 显示配置摘要 */}
        {Object.keys(nodeConfig).length > 0 && !showConfig && (
          <div className="node-config-summary">
            {Object.entries(nodeConfig)
              .slice(0, 2)
              .map(([key, val]) => {
                const configDef = configs.find((c) => c.key === key);
                return val ? (
                  <div key={key} className="config-tag">
                    <span className="config-label">{configDef?.label || key}:</span>
                    <span className="config-value">{val}</span>
                  </div>
                ) : null;
              })}
          </div>
        )}
      </div>

      {/* 配置面板 */}
      {showConfig && configs.length > 0 && (
        <div className="node-config-panel" onClick={(e) => e.stopPropagation()}>
          <div className="config-title">节点配置</div>
          {configs.map((config) => (
            <div key={config.key} className="config-field">
              <label>{config.label}</label>
              {config.type === 'select' ? (
                <select
                  value={nodeConfig[config.key] || config.default}
                  onChange={(e) => handleConfigChange(config.key, e.target.value)}
                >
                  {config.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : config.type === 'number' ? (
                <input
                  type="number"
                  value={nodeConfig[config.key] || config.default}
                  onChange={(e) => handleConfigChange(config.key, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  value={nodeConfig[config.key] || config.default}
                  onChange={(e) => handleConfigChange(config.key, e.target.value)}
                  placeholder={`请输入${config.label}`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 端口 */}
      <div className="node-ports">
        {/* 输入端口 */}
        <div className="port-group inputs">
          {node.inputs.map((port, _index) => (
            <div
              key={port.id}
              className="port inputs"
              data-port-id={port.id}
              data-port-type="input"
              data-node-id={node.id}
              onMouseDown={(e) => onPortMouseDown(node.id, port.id, 'input', e)}
            >
              <div className="port-dot" />
              <span>{port.label}</span>
            </div>
          ))}
        </div>

        {/* 输出端口 */}
        <div className="port-group outputs">
          {node.outputs.map((port, _index) => (
            <div
              key={port.id}
              className="port outputs"
              data-port-id={port.id}
              data-port-type="output"
              data-node-id={node.id}
              onMouseDown={(e) => onPortMouseDown(node.id, port.id, 'output', e)}
            >
              <div className="port-dot" />
              <span>{port.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
