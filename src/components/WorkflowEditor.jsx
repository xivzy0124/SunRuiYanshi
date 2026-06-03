import { useState, useRef, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import '../styles/workflowEditor.css';
import WorkflowNode from './WorkflowNode';
import ContextMenu from './ContextMenu';

// 默认节点数据
const DEFAULT_NODES = [
  {
    id: 'node-start',
    type: 'start',
    label: '开始',
    x: 200,
    y: 300,
    inputs: [],
    outputs: [{ id: 'out-1', label: '输出' }],
    config: {},
  },
];

const WorkflowEditor = forwardRef(function WorkflowEditor({
  onBack,
  onExecute,
  onShowTemplate,
  onShowHistory,
  workflowConfig: _workflowConfig,
  onConfigChange: _onConfigChange,
}, ref) {
  const [nodes, setNodes] = useState(DEFAULT_NODES);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [edgeDragState, setEdgeDragState] = useState(null);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(null);
  const canvasRef = useRef(null);

  // 主题感知的节点类型定义
  const NODE_TYPES = useMemo(() => {
    const style = getComputedStyle(document.documentElement);
    const resolve = (cssVar) => style.getPropertyValue(cssVar).trim();
    return {
      start: { label: '开始', color: resolve('--green'), icon: '▶', desc: '工作流开始节点' },
      end: { label: '结束', color: resolve('--red'), icon: '⏹', desc: '工作流结束节点' },
      process: { label: '处理', color: resolve('--accent'), icon: '⚙', desc: '数据处理节点' },
      condition: { label: '条件', color: resolve('--orange'), icon: '❖', desc: '条件判断节点' },
      input: { label: '输入', color: resolve('--cyan'), icon: '📥', desc: '数据输入节点' },
      output: { label: '输出', color: resolve('--purple'), icon: '📤', desc: '数据输出节点' },
      transform: { label: '转换', color: resolve('--pink'), icon: '🔄', desc: '数据转换节点' },
      merge: { label: '合并', color: resolve('--purple'), icon: '⊕', desc: '数据合并节点' },
    };
  }, [document.documentElement.dataset.theme]);
  const containerRef = useRef(null);
  const edgeDragRef = useRef(null);
  const [injectingNodes, setInjectingNodes] = useState(new Set());

  // 生成唯一 ID
  const generateId = useCallback(
    () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  // AI 注入工作流 — 节点逐个出现，连线逐条画出
  const injectWorkflow = useCallback(
    (workflow) => {
      if (!workflow || !workflow.nodes || workflow.nodes.length === 0) return;

      const isAppend = workflow.nodes.length <= 2;
      const idMap = {};

      workflow.nodes.forEach((_, i) => {
        idMap[i] = generateId();
      });

      // 追加模式偏移
      let offsetX = 0;
      let offsetY = 0;
      if (isAppend) {
        setNodes((prev) => {
          if (prev.length > 0) {
            const maxX = Math.max(...prev.map((n) => n.x + 180));
            const avgY = prev.reduce((sum, n) => sum + n.y, 0) / prev.length;
            offsetX = maxX + 80;
            offsetY = avgY - 60;
          }
          return prev;
        });
      }

      const newNodes = workflow.nodes.map((aiNode, i) => ({
        id: idMap[i],
        type: aiNode.type,
        label: aiNode.label,
        x: isAppend ? offsetX + (aiNode.x || 0) : aiNode.x,
        y: isAppend ? offsetY + (aiNode.y || 0) : aiNode.y,
        inputs: aiNode.type === 'start' ? [] : [{ id: 'in-1', label: '输入' }],
        outputs: aiNode.type === 'end' ? [] : [{ id: 'out-1', label: '输出' }],
        config: aiNode.config || {},
      }));

      const newEdges = (workflow.edges || []).map((aiEdge) => ({
        id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        source: idMap[aiEdge.source],
        target: idMap[aiEdge.target],
        sourceHandle: 'out-1',
        targetHandle: 'in-1',
      }));

      // 清空画布，准备注入
      if (!isAppend) {
        setNodes([]);
        setEdges([]);
      }

      // 自动平移到目标区域
      if (newNodes.length > 0) {
        const avgX = newNodes.reduce((sum, n) => sum + n.x, 0) / newNodes.length;
        const avgY = newNodes.reduce((sum, n) => sum + n.y, 0) / newNodes.length;
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          setCanvasOffset({
            x: rect.width / 2 - avgX * zoom,
            y: rect.height / 2 - avgY * zoom,
          });
        }
      }

      // 节点逐个出现（每个间隔 0.5s）
      const NODE_DELAY = 500;
      newNodes.forEach((node, i) => {
        setTimeout(() => {
          setNodes((prev) => [...prev, node]);
          setInjectingNodes((prev) => new Set([...prev, node.id]));
          // 0.8s 后移除动画状态
          setTimeout(() => {
            setInjectingNodes((prev) => {
              const next = new Set(prev);
              next.delete(node.id);
              return next;
            });
          }, 800);
        }, i * NODE_DELAY);
      });

      // 所有节点就位后，连线逐条出现（每条间隔 0.3s）
      const EDGE_START = newNodes.length * NODE_DELAY + 400;
      const EDGE_DELAY = 300;
      newEdges.forEach((edge, i) => {
        setTimeout(() => {
          setEdges((prev) => [...prev, edge]);
        }, EDGE_START + i * EDGE_DELAY);
      });
    },
    [generateId, zoom]
  );

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    injectWorkflow,
  }), [injectWorkflow]);

  // 处理画布点击（取消选择）
  const handleCanvasClick = useCallback((e) => {
    // 只有点击画布本身时才取消选择
    if (e.target === canvasRef.current || e.target === containerRef.current) {
      setSelectedNode(null);
      setSelectedEdge(null);
      setContextMenu(null);
    }
  }, []);

  // 处理右键菜单
  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      // 不在节点上右键时才显示
      if (e.target.closest('.workflow-node')) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const y = (e.clientY - rect.top - canvasOffset.y) / zoom;

      setContextMenu({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        canvasX: x,
        canvasY: y,
      });
    },
    [canvasOffset, zoom]
  );

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 创建新节点
  const createNode = useCallback(
    (type, x, y) => {
      const nodeType = NODE_TYPES[type];
      const newNode = {
        id: generateId(),
        type,
        label: nodeType.label,
        x,
        y,
        inputs: type === 'start' ? [] : [{ id: 'in-1', label: '输入' }],
        outputs: type === 'end' ? [] : [{ id: 'out-1', label: '输出' }],
        config: {},
      };
      setNodes((prev) => [...prev, newNode]);
      setContextMenu(null);
    },
    [generateId]
  );

  // 删除节点
  const deleteNode = useCallback((nodeId) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
  }, []);

  // 更新节点配置
  const handleConfigChange = useCallback((nodeId, config) => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, config } : node)));
  }, []);

  // 处理节点拖拽 - 使用 mousedown/mousemove/mouseup 模式
  const handleNodeMouseDown = useCallback(
    (nodeId, e) => {
      // 忽略端口、按钮和配置面板的点击
      if (
        e.target.closest('.port') ||
        e.target.closest('button') ||
        e.target.closest('.node-config-panel')
      ) {
        return;
      }

      e.stopPropagation();
      e.preventDefault();

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      setSelectedNode(nodeId);
      setSelectedEdge(null);

      setDragState({
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        nodeStartX: node.x,
        nodeStartY: node.y,
      });
    },
    [nodes]
  );

  // 处理节点拖拽移动
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e) => {
      e.preventDefault();
      const dx = (e.clientX - dragState.startX) / zoom;
      const dy = (e.clientY - dragState.startY) / zoom;

      setNodes((prev) =>
        prev.map((node) =>
          node.id === dragState.nodeId
            ? { ...node, x: dragState.nodeStartX + dx, y: dragState.nodeStartY + dy }
            : node
        )
      );
    };

    const handleMouseUp = (e) => {
      e.preventDefault();
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, zoom]);

  // 获取端口在画布中的绝对位置
  // 纯数学计算端口位置，不依赖 DOM（避免动画期间定位失败）
  const getPortPosition = useCallback(
    (nodeId, portId, portType) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };

      const NODE_W = 180;
      const HEADER_H = 44;  // node-header 高度
      const PORT_GAP = 22;  // 每个端口占的高度
      const PORT_START = HEADER_H + 14; // 第一个端口的 y 偏移

      if (portType === 'output') {
        const idx = node.outputs.findIndex((p) => p.id === portId);
        return {
          x: node.x + NODE_W,
          y: node.y + PORT_START + Math.max(idx, 0) * PORT_GAP,
        };
      } else {
        const idx = node.inputs.findIndex((p) => p.id === portId);
        return {
          x: node.x,
          y: node.y + PORT_START + Math.max(idx, 0) * PORT_GAP,
        };
      }
    },
    [nodes]
  );

  // 开始拖拽连线
  const handlePortMouseDown = useCallback(
    (nodeId, portId, portType, e) => {
      e.stopPropagation();
      e.preventDefault();

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      // 获取端口的实际位置
      const pos = getPortPosition(nodeId, portId, portType);

      const state = {
        sourceNodeId: portType === 'output' ? nodeId : null,
        sourcePortId: portType === 'output' ? portId : null,
        targetNodeId: portType === 'input' ? nodeId : null,
        targetPortId: portType === 'input' ? portId : null,
        startX: pos.x,
        startY: pos.y,
        canvasX: pos.x,
        canvasY: pos.y,
      };

      edgeDragRef.current = state;
      setEdgeDragState(state);
    },
    [nodes, getPortPosition]
  );

  // 处理连线拖拽
  useEffect(() => {
    if (!edgeDragState) return;

    const handleMouseMove = (e) => {
      e.preventDefault();
      // 计算画布坐标
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const canvasX = (e.clientX - rect.left - canvasOffset.x) / zoom;
      const canvasY = (e.clientY - rect.top - canvasOffset.y) / zoom;

      const newState = {
        ...edgeDragRef.current,
        canvasX,
        canvasY,
      };

      edgeDragRef.current = newState;
      setEdgeDragState(newState);
    };

    const handleMouseUp = (e) => {
      e.preventDefault();
      // 检查是否释放在一个端口上
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const portElement = target?.closest('.port');

      if (portElement && edgeDragRef.current?.sourceNodeId) {
        const targetNodeId = portElement.dataset.nodeId;
        const targetPortId = portElement.dataset.portId;
        const targetPortType = portElement.dataset.portType;

        // 确保不是连接到自己，且是从输出到输入
        if (targetNodeId !== edgeDragRef.current.sourceNodeId && targetPortType === 'input') {
          const newEdge = {
            id: `edge-${Date.now()}`,
            source: edgeDragRef.current.sourceNodeId,
            sourceHandle: edgeDragRef.current.sourcePortId,
            target: targetNodeId,
            targetHandle: targetPortId,
          };
          setEdges((prev) => [...prev, newEdge]);
        }
      }

      edgeDragRef.current = null;
      setEdgeDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [edgeDragState, canvasOffset, zoom]);

  // 删除连线
  const deleteEdge = useCallback((edgeId) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
    setSelectedEdge(null);
  }, []);

  // 处理画布平移
  const handlePanStart = useCallback(
    (e) => {
      // 只有点击画布背景时才平移
      if (e.button !== 0) return;
      if (e.target !== containerRef.current && e.target !== canvasRef.current) return;

      e.preventDefault();
      setIsPanning(true);
      setSelectedNode(null);
      setSelectedEdge(null);
      panStartRef.current = {
        x: e.clientX - canvasOffset.x,
        y: e.clientY - canvasOffset.y,
      };
    },
    [canvasOffset]
  );

  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e) => {
      e.preventDefault();
      setCanvasOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    };

    const handleMouseUp = (e) => {
      e.preventDefault();
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning]);

  // 处理缩放
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.3, Math.min(2, zoom * delta));

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newOffsetX = mouseX - (mouseX - canvasOffset.x) * (newZoom / zoom);
      const newOffsetY = mouseY - (mouseY - canvasOffset.y) * (newZoom / zoom);

      setZoom(newZoom);
      setCanvasOffset({ x: newOffsetX, y: newOffsetY });
    },
    [zoom, canvasOffset]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(2, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.3, prev * 0.8));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setCanvasOffset({ x: 0, y: 0 });
  }, []);

  // 计算临时连线路径
  const tempEdgePath = edgeDragState
    ? (() => {
        const startX = edgeDragState.startX;
        const startY = edgeDragState.startY;
        const endX = edgeDragState.canvasX;
        const endY = edgeDragState.canvasY;

        const dx = Math.abs(endX - startX);
        const controlPointOffset = Math.max(50, dx * 0.4);

        return `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;
      })()
    : '';

  // 计算连线路径
  const getEdgePath = useCallback(
    (edge) => {
      const sourcePos = getPortPosition(edge.source, edge.sourceHandle, 'output');
      const targetPos = getPortPosition(edge.target, edge.targetHandle, 'input');

      const dx = Math.abs(targetPos.x - sourcePos.x);
      const controlPointOffset = Math.max(50, dx * 0.4);

      return {
        path: `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + controlPointOffset} ${sourcePos.y}, ${targetPos.x - controlPointOffset} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`,
        center: {
          x: (sourcePos.x + targetPos.x) / 2,
          y: (sourcePos.y + targetPos.y) / 2,
        },
      };
    },
    [getPortPosition]
  );

  return (
    <div className="workflow-editor" onClick={handleCanvasClick}>
      {/* 顶部工具栏 */}
      <div className="workflow-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn" onClick={onBack}>
            <span className="icon">←</span>
            返回
          </button>
          <h1 className="toolbar-title">
            工作流<span>编辑器</span>
          </h1>
        </div>
        <div className="toolbar-right">
          <span className="toolbar-info">
            节点: {nodes.length} | 连线: {edges.length}
          </span>
          <button
            className="toolbar-btn"
            onClick={() => {
              setNodes(DEFAULT_NODES);
              setEdges([]);
              setSelectedNode(null);
              setSelectedEdge(null);
            }}
          >
            <span className="icon">🗑</span>
            清空
          </button>
          {onShowTemplate && (
            <button className="toolbar-btn" onClick={onShowTemplate}>
              <span className="icon">📋</span>
              模板
            </button>
          )}
          {onShowHistory && (
            <button className="toolbar-btn" onClick={onShowHistory}>
              <span className="icon">📜</span>
              历史
            </button>
          )}
          <button className="toolbar-btn">
            <span className="icon">💾</span>
            保存
          </button>
          <button className="toolbar-btn primary" onClick={onExecute}>
            <span className="icon">▶</span>
            运行
          </button>
        </div>
      </div>

      {/* 画布容器 */}
      <div
        ref={containerRef}
        className="workflow-canvas-container"
        onMouseDown={handlePanStart}
        onContextMenu={handleContextMenu}
      >
        <div
          ref={canvasRef}
          className="workflow-canvas"
          style={{
            transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
          }}
        >
          {/* 提示文字 */}
          {nodes.length <= 1 && edges.length === 0 && (
            <div className="workflow-hint">
              <div className="hint-icon">🎯</div>
              <div className="hint-text">
                <strong>右键</strong> 点击画布创建节点
                <br />从 <strong>输出端口 ●</strong> 拖拽到 <strong>输入端口 ●</strong> 创建连线
                <br />
                点击节点 <strong>⚙</strong> 按钮配置参数
                <br />
                按住 <strong>鼠标左键</strong> 拖拽画布
              </div>
            </div>
          )}

          {/* 连线 SVG */}
          <svg className="workflow-edges">
            {edges.map((edge) => {
              const { path, center } = getEdgePath(edge);
              const isSelected = selectedEdge === edge.id;

              return (
                <g key={edge.id} style={{ animation: 'nodeAppear 0.5s ease both' }}>
                  {/* 透明的宽线用于点击 */}
                  <path
                    d={path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="16"
                    style={{ cursor: 'pointer' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedEdge(edge.id);
                      setSelectedNode(null);
                    }}
                  />
                  {/* 可见的连线 */}
                  <path
                    className={`workflow-edge ${isSelected ? 'selected' : ''}`}
                    d={path}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* 箭头 */}
                  <polygon
                    points="-6,-4 6,0 -6,4"
                    fill={isSelected ? 'var(--accent)' : 'var(--muted)'}
                    transform={`translate(${center.x}, ${center.y}) rotate(0)`}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* 选中时显示删除按钮 */}
                  {isSelected && (
                    <g
                      transform={`translate(${center.x}, ${center.y})`}
                      style={{ cursor: 'pointer' }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        deleteEdge(edge.id);
                      }}
                    >
                      <circle r="10" fill="var(--red)" stroke="var(--bg)" strokeWidth="2" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        ✕
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            {/* 临时连线 */}
            {edgeDragState && tempEdgePath && (
              <g>
                <path
                  className="workflow-edge-temp"
                  d={tempEdgePath}
                  style={{ pointerEvents: 'none' }}
                />
                {/* 临时端点指示器 */}
                <circle
                  cx={edgeDragState.canvasX}
                  cy={edgeDragState.canvasY}
                  r="6"
                  fill="var(--accent)"
                  opacity="0.5"
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            )}
          </svg>

          {/* 节点 */}
          {nodes.map((node) => (
            <WorkflowNode
              key={node.id}
              node={node}
              nodeType={NODE_TYPES[node.type]}
              selected={selectedNode === node.id}
              injecting={injectingNodes.has(node.id)}
              onDragStart={(e) => handleNodeMouseDown(node.id, e)}
              onPortMouseDown={handlePortMouseDown}
              onDelete={() => deleteNode(node.id)}
              onConfigChange={handleConfigChange}
            />
          ))}
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeTypes={NODE_TYPES}
          onCreateNode={(type) => createNode(type, contextMenu.canvasX, contextMenu.canvasY)}
          onClose={closeContextMenu}
        />
      )}

      {/* 缩放控制 */}
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={handleZoomIn} title="放大">
          +
        </button>
        <div className="zoom-level">{Math.round(zoom * 100)}%</div>
        <button className="zoom-btn" onClick={handleZoomOut} title="缩小">
          -
        </button>
        <button className="zoom-btn" onClick={handleZoomReset} title="重置">
          ⟲
        </button>
      </div>

      {/* 小地图 */}
      <div className="workflow-minimap">
        {nodes.map((node) => (
          <div
            key={node.id}
            className={`minimap-node ${selectedNode === node.id ? 'selected' : ''}`}
            style={{
              left: `${(node.x / 4000) * 100}%`,
              top: `${(node.y / 4000) * 100}%`,
              background: NODE_TYPES[node.type]?.color || 'var(--accent)',
            }}
          />
        ))}
        <div
          className="minimap-viewport"
          style={{
            left: `${(-canvasOffset.x / (4000 * zoom)) * 100}%`,
            top: `${(-canvasOffset.y / (4000 * zoom)) * 100}%`,
            width: `${(window.innerWidth / (4000 * zoom)) * 100}%`,
            height: `${(window.innerHeight / (4000 * zoom)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
});

export default WorkflowEditor;
