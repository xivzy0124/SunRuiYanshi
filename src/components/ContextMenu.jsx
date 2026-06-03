import { useEffect, useRef } from 'react';

export default function ContextMenu({ x, y, nodeTypes, onCreateNode, onClose }) {
  const menuRef = useRef(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 计算菜单位置（确保不超出视口）
  const menuStyle = {
    left: `${Math.min(x, window.innerWidth - 200)}px`,
    top: `${Math.min(y, window.innerHeight - 400)}px`,
  };

  return (
    <div ref={menuRef} className="context-menu" style={menuStyle}>
      <div className="context-menu-title">创建节点</div>

      {/* 常用节点 */}
      <button className="context-menu-item" onClick={() => onCreateNode('start')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.start.color}25`,
            color: nodeTypes.start.color,
          }}
        >
          {nodeTypes.start.icon}
        </div>
        <span>开始节点</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('end')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.end.color}25`,
            color: nodeTypes.end.color,
          }}
        >
          {nodeTypes.end.icon}
        </div>
        <span>结束节点</span>
      </button>

      <div className="context-menu-divider" />

      <button className="context-menu-item" onClick={() => onCreateNode('input')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.input.color}25`,
            color: nodeTypes.input.color,
          }}
        >
          {nodeTypes.input.icon}
        </div>
        <span>输入节点</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('output')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.output.color}25`,
            color: nodeTypes.output.color,
          }}
        >
          {nodeTypes.output.icon}
        </div>
        <span>输出节点</span>
      </button>

      <div className="context-menu-divider" />

      <button className="context-menu-item" onClick={() => onCreateNode('process')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.process.color}25`,
            color: nodeTypes.process.color,
          }}
        >
          {nodeTypes.process.icon}
        </div>
        <span>处理节点</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('condition')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.condition.color}25`,
            color: nodeTypes.condition.color,
          }}
        >
          {nodeTypes.condition.icon}
        </div>
        <span>条件节点</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('transform')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.transform.color}25`,
            color: nodeTypes.transform.color,
          }}
        >
          {nodeTypes.transform.icon}
        </div>
        <span>转换节点</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('merge')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.merge.color}25`,
            color: nodeTypes.merge.color,
          }}
        >
          {nodeTypes.merge.icon}
        </div>
        <span>合并节点</span>
      </button>

      <div className="context-menu-divider" />
      <div className="context-menu-section">高级节点</div>

      <button className="context-menu-item" onClick={() => onCreateNode('code')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.code.color}25`,
            color: nodeTypes.code.color,
          }}
        >
          {nodeTypes.code.icon}
        </div>
        <span>代码块</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('sql')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.sql.color}25`,
            color: nodeTypes.sql.color,
          }}
        >
          {nodeTypes.sql.icon}
        </div>
        <span>SQL查询</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('http')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.http.color}25`,
            color: nodeTypes.http.color,
          }}
        >
          {nodeTypes.http.icon}
        </div>
        <span>HTTP请求</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('cache')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.cache.color}25`,
            color: nodeTypes.cache.color,
          }}
        >
          {nodeTypes.cache.icon}
        </div>
        <span>数据缓存</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('log')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.log.color}25`,
            color: nodeTypes.log.color,
          }}
        >
          {nodeTypes.log.icon}
        </div>
        <span>日志记录</span>
      </button>

      <div className="context-menu-divider" />
      <div className="context-menu-section">数据处理</div>

      <button className="context-menu-item" onClick={() => onCreateNode('filter')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.filter.color}25`,
            color: nodeTypes.filter.color,
          }}
        >
          {nodeTypes.filter.icon}
        </div>
        <span>数据过滤</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('aggregate')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.aggregate.color}25`,
            color: nodeTypes.aggregate.color,
          }}
        >
          {nodeTypes.aggregate.icon}
        </div>
        <span>数据聚合</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('sort')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.sort.color}25`,
            color: nodeTypes.sort.color,
          }}
        >
          {nodeTypes.sort.icon}
        </div>
        <span>数据排序</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('sample')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.sample.color}25`,
            color: nodeTypes.sample.color,
          }}
        >
          {nodeTypes.sample.icon}
        </div>
        <span>数据采样</span>
      </button>

      <button className="context-menu-item" onClick={() => onCreateNode('validate')}>
        <div
          className="icon"
          style={{
            background: `${nodeTypes.validate.color}25`,
            color: nodeTypes.validate.color,
          }}
        >
          {nodeTypes.validate.icon}
        </div>
        <span>数据验证</span>
      </button>
    </div>
  );
}
