export default function WorkflowEdge({
  edge,
  sourceNode,
  targetNode,
  selected,
  onClick,
  onDelete,
}) {
  if (!sourceNode || !targetNode) return null;

  // 计算端口位置（与WorkflowEditor中的getPortPosition保持一致）
  const sourcePortIndex = sourceNode.outputs.findIndex((p) => p.id === edge.sourceHandle);
  const targetPortIndex = targetNode.inputs.findIndex((p) => p.id === edge.targetHandle);

  const NODE_W = 220;  // 节点宽度
  const HEADER_H = 44;  // node-header 高度
  const PORT_GAP = 22;  // 每个端口占的高度
  const PORT_START = HEADER_H + 14; // 第一个端口的 y 偏移

  const startX = sourceNode.x + NODE_W; // 输出口在节点右边缘
  const startY = sourceNode.y + PORT_START + Math.max(sourcePortIndex, 0) * PORT_GAP;
  const endX = targetNode.x; // 输入口在节点左边缘
  const endY = targetNode.y + PORT_START + Math.max(targetPortIndex, 0) * PORT_GAP;

  // 计算贝塞尔曲线控制点
  const controlPointOffset = Math.abs(endX - startX) * 0.5;
  const path = `M ${startX} ${startY} C ${startX + controlPointOffset} ${startY}, ${endX - controlPointOffset} ${endY}, ${endX} ${endY}`;

  return (
    <g>
      <path
        className={`workflow-edge ${selected ? 'selected' : ''}`}
        d={path}
        onClick={(e) => {
          e.stopPropagation();
          onClick(e);
        }}
      />
      {/* 删除按钮（选中时显示） */}
      {selected && (
        <g
          transform={`translate(${(startX + endX) / 2}, ${(startY + endY) / 2})`}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{ cursor: 'pointer' }}
        >
          <circle r="10" fill="var(--red)" />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="12"
            fontWeight="bold"
          >
            ✕
          </text>
        </g>
      )}
    </g>
  );
}
