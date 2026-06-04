import { useState, useRef, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Layout, Button, Space, Typography, Tooltip, Badge, message } from 'antd';
import {
  DeleteOutlined,
  FileOutlined,
  HistoryOutlined,
  SaveOutlined,
  PlayCircleOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  ReloadOutlined,
  AimOutlined,
} from '@ant-design/icons';
import WorkflowNode from './WorkflowNode';
import ContextMenu from './ContextMenu';
import { WorkflowHeader } from './PageHeader';
import { nodeIcons } from './Icons';
import { nodeColors } from '../theme';
import '../styles/workflowEditor.css';

const { Header, Content } = Layout;
const { Text } = Typography;

// 画布尺寸（与下方 .workflow-canvas 的 width/height 保持一致）
const CANVAS_SIZE = 4000;

// 画布平移边界 = 真实画布坐标系 0~CANVAS_SIZE
// 平移时允许把画布内任意点移到视口中心，超出画布则不再留空白
const CANVAS_BOUNDS = {
  minX: 0,
  maxX: CANVAS_SIZE,
  minY: 0,
  maxY: CANVAS_SIZE,
};

// 节点边界 = 与画布一致，节点始终待在画布内（拖拽时再减去卡片尺寸）
const NODE_BOUNDS = {
  minX: 0,
  maxX: CANVAS_SIZE,
  minY: 0,
  maxY: CANVAS_SIZE,
};

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
  const containerRef = useRef(null);
  const edgeDragRef = useRef(null);
  const [injectingNodes, setInjectingNodes] = useState(new Set());

  // 节点类型定义
  const NODE_TYPES = useMemo(() => ({
    start: { label: '开始', icon: nodeIcons.start, desc: '工作流开始节点' },
    end: { label: '结束', icon: nodeIcons.end, desc: '工作流结束节点' },
    process: { label: '处理', icon: nodeIcons.process, desc: '数据处理节点' },
    condition: { label: '条件', icon: nodeIcons.condition, desc: '条件判断节点' },
    input: { label: '输入', icon: nodeIcons.input, desc: '数据输入节点' },
    output: { label: '输出', icon: nodeIcons.output, desc: '数据输出节点' },
    transform: { label: '转换', icon: nodeIcons.transform, desc: '数据转换节点' },
    merge: { label: '合并', icon: nodeIcons.merge, desc: '数据合并节点' },
    code: { label: '代码块', icon: nodeIcons.code, desc: '自定义代码执行节点' },
    sql: { label: 'SQL', icon: nodeIcons.sql, desc: 'SQL查询执行节点' },
    filter: { label: '过滤', icon: nodeIcons.filter, desc: '数据过滤筛选节点' },
    aggregate: { label: '聚合', icon: nodeIcons.aggregate, desc: '数据聚合统计节点' },
    sort: { label: '排序', icon: nodeIcons.sort, desc: '数据排序节点' },
    sample: { label: '采样', icon: nodeIcons.sample, desc: '数据采样节点' },
    validate: { label: '验证', icon: nodeIcons.validate, desc: '数据验证节点' },
    http: { label: 'HTTP', icon: nodeIcons.http, desc: 'HTTP请求节点' },
    cache: { label: '缓存', icon: nodeIcons.cache, desc: '数据缓存节点' },
    log: { label: '日志', icon: nodeIcons.log, desc: '日志记录节点' },
  }), []);

  // 生成唯一 ID
  const generateId = useCallback(
    () => `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  // AI 注入工作流
  const injectWorkflow = useCallback(
    (workflow) => {
      if (!workflow || !workflow.nodes || workflow.nodes.length === 0) return;

      const isAppend = workflow.nodes.length <= 2;
      const idMap = {};

      workflow.nodes.forEach((_, i) => {
        idMap[i] = generateId();
      });

      let offsetX = 0;
      let offsetY = 0;
      if (isAppend) {
        setNodes((prev) => {
          if (prev.length > 0) {
            const maxX = Math.max(...prev.map((n) => n.x + 220));
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

      if (!isAppend) {
        setNodes([]);
        setEdges([]);
      }

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

      const NODE_DELAY = newNodes.length > 20 ? 150 : 500;
      newNodes.forEach((node, i) => {
        setTimeout(() => {
          setNodes((prev) => [...prev, node]);
          setInjectingNodes((prev) => new Set([...prev, node.id]));
          setTimeout(() => {
            setInjectingNodes((prev) => {
              const next = new Set(prev);
              next.delete(node.id);
              return next;
            });
          }, 300);
        }, i * NODE_DELAY);
      });

      const EDGE_START = newNodes.length * NODE_DELAY + 200;
      const EDGE_DELAY = newEdges.length > 20 ? 80 : 300;
      newEdges.forEach((edge, i) => {
        setTimeout(() => {
          setEdges((prev) => [...prev, edge]);
        }, EDGE_START + i * EDGE_DELAY);
      });

      message.success(`已注入 ${newNodes.length} 个节点，${newEdges.length} 条连线`);
    },
    [generateId, zoom]
  );

  useImperativeHandle(ref, () => ({
    injectWorkflow,
  }), [injectWorkflow]);

  // 处理画布点击
  const handleCanvasClick = useCallback((e) => {
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

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 创建新节点
  const createNode = useCallback(
    (type, x, y) => {
      const nodeType = NODE_TYPES[type];

      let finalX = x;
      let finalY = y;

      if (finalX === undefined || finalY === undefined) {
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          finalX = (rect.width / 2 - canvasOffset.x) / zoom - 90;
          finalY = (rect.height / 2 - canvasOffset.y) / zoom - 40;
        } else {
          finalX = 0;
          finalY = 0;
        }
      }

      const newNode = {
        id: generateId(),
        type,
        label: nodeType.label,
        x: finalX,
        y: finalY,
        inputs: type === 'start' ? [] : [{ id: 'in-1', label: '输入' }],
        outputs: type === 'end' ? [] : [{ id: 'out-1', label: '输出' }],
        config: {},
      };
      setNodes((prev) => [...prev, newNode]);
      setContextMenu(null);
      message.success(`已创建${nodeType.label}节点`);
    },
    [generateId, canvasOffset, zoom, NODE_TYPES]
  );

  // 删除节点
  const deleteNode = useCallback((nodeId) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    setSelectedNode(null);
    message.success('已删除节点');
  }, []);

  // 更新节点配置
  const handleConfigChange = useCallback((nodeId, config) => {
    setNodes((prev) => prev.map((node) => (node.id === nodeId ? { ...node, config } : node)));
  }, []);

  // 处理节点拖拽
  const handleNodeMouseDown = useCallback(
    (nodeId, e) => {
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

      let newX = dragState.nodeStartX + dx;
      let newY = dragState.nodeStartY + dy;

      const nodeWidth = 220;
      const nodeHeight = 120;

      if (newX < NODE_BOUNDS.minX) newX = NODE_BOUNDS.minX;
      if (newX + nodeWidth > NODE_BOUNDS.maxX) newX = NODE_BOUNDS.maxX - nodeWidth;
      if (newY < NODE_BOUNDS.minY) newY = NODE_BOUNDS.minY;
      if (newY + nodeHeight > NODE_BOUNDS.maxY) newY = NODE_BOUNDS.maxY - nodeHeight;

      setNodes((prev) =>
        prev.map((node) =>
          node.id === dragState.nodeId
            ? { ...node, x: newX, y: newY }
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

  // 获取端口位置
  const getPortPosition = useCallback(
    (nodeId, portId, portType) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };

      const NODE_W = 220;
      const HEADER_H = 44;
      const PORT_GAP = 22;
      const PORT_START = HEADER_H + 14;

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
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const portElement = target?.closest('.port');

      if (portElement && edgeDragRef.current?.sourceNodeId) {
        const targetNodeId = portElement.dataset.nodeId;
        const targetPortId = portElement.dataset.portId;
        const targetPortType = portElement.dataset.portType;

        if (targetNodeId !== edgeDragRef.current.sourceNodeId && targetPortType === 'input') {
          const newEdge = {
            id: `edge-${Date.now()}`,
            source: edgeDragRef.current.sourceNodeId,
            sourceHandle: edgeDragRef.current.sourcePortId,
            target: targetNodeId,
            targetHandle: targetPortId,
          };
          setEdges((prev) => [...prev, newEdge]);
          message.success('已创建连线');
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
    message.success('已删除连线');
  }, []);

  // 处理画布平移
  const handlePanStart = useCallback(
    (e) => {
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
      const newX = e.clientX - panStartRef.current.x;
      const newY = e.clientY - panStartRef.current.y;

      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const minX = -(CANVAS_BOUNDS.maxX * zoom - rect.width / 2);
        const maxX = rect.width / 2 - (CANVAS_BOUNDS.minX * zoom);
        const minY = -(CANVAS_BOUNDS.maxY * zoom - rect.height / 2);
        const maxY = rect.height / 2 - (CANVAS_BOUNDS.minY * zoom);

        setCanvasOffset({
          x: Math.max(minX, Math.min(maxX, newX)),
          y: Math.max(minY, Math.min(maxY, newY)),
        });
      }
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
  }, [isPanning, zoom]);

  // 处理缩放
  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.3, Math.min(2, zoom * delta));

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let newOffsetX = mouseX - (mouseX - canvasOffset.x) * (newZoom / zoom);
      let newOffsetY = mouseY - (mouseY - canvasOffset.y) * (newZoom / zoom);

      const minX = -(CANVAS_BOUNDS.maxX * newZoom - rect.width / 2);
      const maxX = rect.width / 2 - (CANVAS_BOUNDS.minX * newZoom);
      const minY = -(CANVAS_BOUNDS.maxY * newZoom - rect.height / 2);
      const maxY = rect.height / 2 - (CANVAS_BOUNDS.minY * newZoom);

      newOffsetX = Math.max(minX, Math.min(maxX, newOffsetX));
      newOffsetY = Math.max(minY, Math.min(maxY, newOffsetY));

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

  // 清空画布
  const handleClear = useCallback(() => {
    setNodes(DEFAULT_NODES);
    setEdges([]);
    setSelectedNode(null);
    setSelectedEdge(null);
    message.success('已清空画布');
  }, []);

  // 计算临时连线路径
  const tempEdgePath = edgeDragState
    ? (() => {
        const startX = edgeDragState.startX;
        const startY = edgeDragState.startY;
        const endX = edgeDragState.canvasX;
        const endY = edgeDragState.canvasY;

        const dx = Math.abs(endX - startX);
        const dy = Math.abs(endY - startY);
        const controlPointOffset = Math.max(30, Math.min(dx * 0.3, 100));

        // 使用更平滑的贝塞尔曲线
        return `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;
      })()
    : '';

  // 计算连线路径
  const getEdgePath = useCallback(
    (edge) => {
      const sourcePos = getPortPosition(edge.source, edge.sourceHandle, 'output');
      const targetPos = getPortPosition(edge.target, edge.targetHandle, 'input');

      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // 计算控制点偏移量，让曲线更平滑
      const controlPointOffset = Math.max(50, Math.min(absDx * 0.4, 150));

      // 使用更平滑的贝塞尔曲线
      // 控制点水平延伸，让连线更优雅
      const path = `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + controlPointOffset} ${sourcePos.y}, ${targetPos.x - controlPointOffset} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`;

      return {
        path,
        center: {
          x: (sourcePos.x + targetPos.x) / 2,
          y: (sourcePos.y + targetPos.y) / 2,
        },
      };
    },
    [getPortPosition]
  );

  return (
    <Layout style={{ height: '100vh', background: 'var(--bg)' }}>
      {/* 顶部工具栏 */}
      <WorkflowHeader
        onBack={onBack}
        nodeCount={nodes.length}
        edgeCount={edges.length}
        extra={
          <Space size={8}>
            <Button
              icon={<DeleteOutlined />}
              onClick={handleClear}
            >
              清空
            </Button>
            {onShowTemplate && (
              <Button
                icon={<FileOutlined />}
                onClick={onShowTemplate}
              >
                模板
              </Button>
            )}
            {onShowHistory && (
              <Button
                icon={<HistoryOutlined />}
                onClick={onShowHistory}
              >
                历史
              </Button>
            )}
            <Button
              icon={<SaveOutlined />}
            >
              保存
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={onExecute}
            >
              运行
            </Button>
          </Space>
        }
      />

      <Content style={{ position: 'relative', overflow: 'hidden' }}>
        {/* 画布容器 */}
        <div
          ref={containerRef}
          className="workflow-canvas-container"
          onMouseDown={handlePanStart}
          onContextMenu={handleContextMenu}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: isPanning ? 'grabbing' : 'default',
          }}
        >
          <div
            ref={canvasRef}
            className="workflow-canvas"
            style={{
              position: 'absolute',
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              backgroundImage: 'radial-gradient(circle, var(--grid-color) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              transformOrigin: '0 0',
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
            }}
          >
            {/* 提示文字 */}
            {nodes.length <= 1 && edges.length === 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  color: 'var(--muted)',
                }}
              >
                <AimOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                <div>
                  <Text strong>右键</Text> 点击画布创建节点
                </div>
                <div>
                  从 <Text strong>输出端口 ●</Text> 拖拽到 <Text strong>输入端口 ●</Text> 创建连线
                </div>
                <div>
                  点击节点 <Text strong>⚙</Text> 按钮配置参数
                </div>
                <div>
                  按住 <Text strong>鼠标左键</Text> 拖拽画布
                </div>
              </div>
            )}

            {/* 连线 SVG */}
            <svg
              className="workflow-edges"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            >
              {edges.map((edge) => {
                const { path, center } = getEdgePath(edge);
                const isSelected = selectedEdge === edge.id;

                return (
                  <g key={edge.id} style={{ animation: 'nodeAppear 0.5s ease both' }}>
                    <path
                      d={path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="16"
                      style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelectedEdge(edge.id);
                        setSelectedNode(null);
                      }}
                    />
                    <path
                      className={`workflow-edge ${isSelected ? 'selected' : ''}`}
                      d={path}
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* 箭头 */}
                    <polygon
                      points="-6,-4 6,0 -6,4"
                      fill={isSelected ? '#6c8cff' : '#94a3b8'}
                      transform={`translate(${center.x}, ${center.y}) rotate(0)`}
                      style={{
                        pointerEvents: 'none',
                        opacity: isSelected ? 1 : 0.6,
                        transition: 'all 0.3s ease',
                      }}
                    />
                    {isSelected && (
                      <g
                        transform={`translate(${center.x}, ${center.y})`}
                        style={{ cursor: 'pointer' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          deleteEdge(edge.id);
                        }}
                      >
                        <circle r="10" fill="#f87171" stroke="var(--bg)" strokeWidth="2" />
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
              {edgeDragState && tempEdgePath && (
                <g>
                  <path
                    className="workflow-edge-temp"
                    d={tempEdgePath}
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle
                    cx={edgeDragState.canvasX}
                    cy={edgeDragState.canvasY}
                    r="8"
                    fill="#6c8cff"
                    opacity="0.6"
                    style={{
                      pointerEvents: 'none',
                      filter: 'drop-shadow(0 2px 4px rgba(108, 140, 255, 0.4))',
                    }}
                  />
                  <circle
                    cx={edgeDragState.canvasX}
                    cy={edgeDragState.canvasY}
                    r="4"
                    fill="white"
                    opacity="0.8"
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
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            zIndex: 50,
          }}
        >
          <Tooltip title="放大" placement="left">
            <Button
              shape="circle"
              icon={<ZoomInOutlined />}
              onClick={handleZoomIn}
            />
          </Tooltip>
          <div
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--muted)',
              background: 'var(--card)',
              borderRadius: 4,
              padding: '4px 8px',
            }}
          >
            {Math.round(zoom * 100)}%
          </div>
          <Tooltip title="缩小" placement="left">
            <Button
              shape="circle"
              icon={<ZoomOutOutlined />}
              onClick={handleZoomOut}
            />
          </Tooltip>
          <Tooltip title="重置" placement="left">
            <Button
              shape="circle"
              icon={<ReloadOutlined />}
              onClick={handleZoomReset}
            />
          </Tooltip>
        </div>

        {/* 小地图 */}
        <div
          className="workflow-minimap"
          style={{
            position: 'absolute',
            bottom: 20,
            right: 80,
            width: 180,
            height: 120,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
            zIndex: 50,
          }}
        >
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`minimap-node ${selectedNode === node.id ? 'selected' : ''}`}
              style={{
                position: 'absolute',
                width: 6,
                height: 4,
                borderRadius: 1,
                left: `${(node.x / CANVAS_SIZE) * 100}%`,
                top: `${(node.y / CANVAS_SIZE) * 100}%`,
                background: nodeColors[node.type] || 'var(--accent)',
                transition: 'all 0.2s',
              }}
            />
          ))}
          <div
            className="minimap-viewport"
            style={{
              position: 'absolute',
              border: '2px solid var(--accent)',
              borderRadius: 2,
              background: 'rgba(108, 140, 255, 0.1)',
              left: `${(-canvasOffset.x / (CANVAS_SIZE * zoom)) * 100}%`,
              top: `${(-canvasOffset.y / (CANVAS_SIZE * zoom)) * 100}%`,
              width: `${(window.innerWidth / (CANVAS_SIZE * zoom)) * 100}%`,
              height: `${(window.innerHeight / (CANVAS_SIZE * zoom)) * 100}%`,
            }}
          />
        </div>
      </Content>
    </Layout>
  );
});

export default WorkflowEditor;
