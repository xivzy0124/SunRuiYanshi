export default function WorkflowEdge({
  edge,
  sourceNode,
  targetNode,
  selected,
  onClick,
  onDelete,
}) {
  if (!sourceNode || !targetNode) return null;

  // 计算端口位置
  const sourcePortIndex = sourceNode.outputs.findIndex((p) => p.id === edge.sourceHandle);
  const targetPortIndex = targetNode.inputs.findIndex((p) => p.id === edge.targetHandle);

  const startX = sourceNode.x + 180; // 节点宽度
  const startY = sourceNode.y + 60 + sourcePortIndex * 24;
  const endX = targetNode.x;
  const endY = targetNode.y + 60 + targetPortIndex * 24;

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
          <circle r="10" fill="#f87171" />
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
