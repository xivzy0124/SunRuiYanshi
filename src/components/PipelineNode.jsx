import useCountUp from '../hooks/useCountUp';

export default function PipelineNode({ id, label, sub, tag, stream, active, onClick, inputCount, outputCount }) {
  const animatedInput = useCountUp(inputCount || 0, 1500, 300);
  const animatedOutput = useCountUp(outputCount || 0, 1500, 600);
  const showCount = inputCount != null;
  const hasReduction = showCount && inputCount !== outputCount;

  return (
    <div
      className={`node stream-${stream}${active ? ' active' : ''}`}
      onClick={() => onClick(id)}
    >
      <div className="node-label">{label}</div>
      <div className="node-sub">{sub}</div>
      {tag && <span className="tag">{tag}</span>}
      {showCount && (
        <div className="node-count">
          {hasReduction ? (
            <>
              <span className="count-in">{animatedInput.toLocaleString()}</span>
              <span className="count-arrow">→</span>
              <span className="count-out">{animatedOutput.toLocaleString()}</span>
              <span className="count-unit">条</span>
            </>
          ) : (
            <>
              <span className="count-out">{animatedOutput.toLocaleString()}</span>
              <span className="count-unit">条</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
