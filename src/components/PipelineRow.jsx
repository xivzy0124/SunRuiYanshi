import PipelineNode from './PipelineNode';
import DataFlowArrow from './DataFlowArrow';

export default function PipelineRow({ label, color, nodes, stream, activeId, onNodeClick }) {
  const arrowColor = stream === 'a' ? 'var(--accent)' : stream === 'b' ? 'var(--cyan)' : 'var(--muted)';

  return (
    <div className="pipeline-row">
      {label && (
        <div className="pipeline-label-inline">
          <span className="pipeline-label-bar" style={{ background: color }} />
          <span className="pipeline-label-text" style={{ color }}>
            {label}
          </span>
        </div>
      )}
      <div className="pipeline-grid">
        {nodes.map((node, i) => (
          <div key={node.id} className="pipeline-cell" style={{ display: 'contents' }}>
            {i > 0 && <DataFlowArrow color={arrowColor} />}
            <PipelineNode
              id={node.id}
              label={node.label}
              sub={node.sub}
              tag={node.tag}
              stream={stream}
              active={activeId === node.id}
              onClick={onNodeClick}
              inputCount={node.inputCount}
              outputCount={node.outputCount}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
