import PipelineNode from './PipelineNode';
import { mergedNodes } from '../data/pipelineData';

function ForkArrow() {
  return (
    <div className="fork-arrow">
      <svg width="60" height="100" viewBox="0 0 60 100" fill="none">
        <line x1="0" y1="50" x2="20" y2="50" stroke="var(--green)" strokeWidth="2" strokeDasharray="4 3">
          <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
        </line>
        <circle cx="20" cy="50" r="3" fill="var(--green)" opacity="0.8">
          <animate attributeName="r" values="3;4;3" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <path d="M20,50 Q35,50 40,25 L60,25" stroke="var(--orange)" strokeWidth="2" strokeDasharray="4 3" fill="none">
          <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
        </path>
        <path d="M20,50 Q35,50 40,75 L60,75" stroke="var(--orange)" strokeWidth="2" strokeDasharray="4 3" fill="none">
          <animate attributeName="stroke-dashoffset" from="0" to="-14" dur="1s" repeatCount="indefinite" />
        </path>
        <circle r="3" fill="var(--orange)" opacity="0.9">
          <animateMotion dur="1.2s" repeatCount="indefinite" path="M0,50 L20,50 Q35,50 40,25 L60,25" />
        </circle>
        <circle r="3" fill="var(--orange)" opacity="0.9">
          <animateMotion dur="1.2s" repeatCount="indefinite" path="M0,50 L20,50 Q35,50 40,75 L60,75" />
        </circle>
      </svg>
      <div className="fork-label">并行输出</div>
    </div>
  );
}

export default function MergedPipeline({ activeId, onNodeClick }) {
  const joinNode = mergedNodes.find(n => n.id === 'join');
  const outputNodes = mergedNodes.filter(n => n.id !== 'join');

  return (
    <div className="merged-pipeline">
      <div className="pipeline-label-inline">
        <span className="pipeline-label-bar" style={{ background: '#34d399' }} />
        <span className="pipeline-label-text" style={{ color: '#34d399' }}>融合与输出</span>
      </div>
      <div className="merged-grid-fork">
        <PipelineNode
          id={joinNode.id}
          label={joinNode.label}
          sub={joinNode.sub}
          tag={joinNode.tag}
          stream={joinNode.stream}
          active={activeId === joinNode.id}
          onClick={onNodeClick}
          inputCount={joinNode.inputCount}
          outputCount={joinNode.outputCount}
        />

        <ForkArrow />

        <div className="parallel-outputs">
          {outputNodes.map(node => (
            <PipelineNode
              key={node.id}
              id={node.id}
              label={node.label}
              sub={node.sub}
              tag={node.tag}
              stream={node.stream}
              active={activeId === node.id}
              onClick={onNodeClick}
              inputCount={node.inputCount}
              outputCount={node.outputCount}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
