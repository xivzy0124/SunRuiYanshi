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
    </div>
  );
}
