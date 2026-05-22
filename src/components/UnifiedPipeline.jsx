import PipelineNode from './PipelineNode';
import { pipelineRows, mergedNodes } from '../data/pipelineData';

const STAGES = [
  { id: 'source', label: 'SOURCE', color: '#6c8cff' },
  { id: 'filter', label: 'FILTER', color: '#818cf8' },
  { id: 'map',    label: 'MAP',    color: '#22d3ee' },
  { id: 'calc',   label: 'CALC',   color: '#a78bfa' },
  { id: 'join',   label: 'JOIN',   color: '#34d399' },
  { id: 'output', label: 'OUTPUT', color: '#fb923c' },
];

function Arrow({ color, className = 'pl-arrow' }) {
  return (
    <div className={className}>
      <svg width="100%" height="20" viewBox="0 0 48 20" preserveAspectRatio="xMidYMid meet" fill="none">
        <path d="M0 5 L30 5 L30 1 L44 10 L30 19 L30 15 L0 15 Z" fill={color} opacity="0.06" />
        <path d="M0 5 L30 5 L30 1 L44 10" stroke={color} strokeWidth="1.2" strokeLinejoin="round" fill="none" opacity="0.45" />
        <path d="M0 15 L30 15 L30 19 L44 10" stroke={color} strokeWidth="1.2" strokeLinejoin="round" fill="none" opacity="0.45" />
        <path d="M3 10 L36 10" stroke={color} strokeWidth="1.2" strokeDasharray="3 3" opacity="0.5">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>
        <circle r="2" fill={color} opacity="0.85">
          <animateMotion dur="1s" repeatCount="indefinite" path="M3,10 L40,10" />
        </circle>
      </svg>
    </div>
  );
}

function MergeConnector() {
  return (
    <div className="pl-merge-connector">
      <svg viewBox="0 0 72 178" preserveAspectRatio="none" fill="none">
        <path d="M0 41 H14 C28 41 34 54 42 68 L54 89" stroke="#6c8cff" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5" />
        <path d="M0 137 H14 C28 137 34 124 42 110 L54 89" stroke="#22d3ee" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5" />
        <path d="M54 89 H72" stroke="#34d399" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.55" />

        <path d="M0 41 H14 C28 41 34 54 42 68 L54 89" stroke="#6c8cff" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.7">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path d="M0 137 H14 C28 137 34 124 42 110 L54 89" stroke="#22d3ee" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.7">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path d="M54 89 H72" stroke="#34d399" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.75">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>

        <circle r="2.2" fill="#6c8cff" opacity="0.85">
          <animateMotion dur="1.1s" repeatCount="indefinite" path="M0,41 H14 C28,41 34,54 42,68 L54,89" />
        </circle>
        <circle r="2.2" fill="#22d3ee" opacity="0.85">
          <animateMotion dur="1.1s" repeatCount="indefinite" begin="0.2s" path="M0,137 H14 C28,137 34,124 42,110 L54,89" />
        </circle>
        <circle r="2.2" fill="#34d399" opacity="0.9">
          <animateMotion dur="0.8s" repeatCount="indefinite" begin="0.35s" path="M54,89 H72" />
        </circle>

        <circle cx="54" cy="89" r="3.8" fill="#34d399" opacity="0.95">
          <animate attributeName="r" values="3.2;5;3.2" dur="1.2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function ForkArrow() {
  return (
    <div className="pl-fork">
      <svg viewBox="0 0 72 174" preserveAspectRatio="none" fill="none">
        <path d="M0 87 H24" stroke="var(--green)" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
        <path d="M24 87 C42 87 42 41 72 41" stroke="var(--orange)" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.55" />
        <path d="M24 87 C42 87 42 133 72 133" stroke="var(--orange)" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.55" />

        <path d="M0 87 H24" stroke="var(--green)" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.75">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path d="M24 87 C42 87 42 41 72 41" stroke="var(--orange)" strokeWidth="1.2" strokeDasharray="4 4" fill="none" opacity="0.75">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path d="M24 87 C42 87 42 133 72 133" stroke="var(--orange)" strokeWidth="1.2" strokeDasharray="4 4" fill="none" opacity="0.75">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>

        <path d="M66 36 L72 41 L66 46" stroke="var(--orange)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
        <path d="M66 128 L72 133 L66 138" stroke="var(--orange)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />

        <circle cx="24" cy="87" r="3.8" fill="var(--green)" opacity="0.95">
          <animate attributeName="r" values="3.2;5;3.2" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <circle r="2.2" fill="var(--green)" opacity="0.85">
          <animateMotion dur="0.8s" repeatCount="indefinite" path="M0,87 H24" />
        </circle>
        <circle r="2.2" fill="var(--orange)" opacity="0.85">
          <animateMotion dur="1.1s" repeatCount="indefinite" begin="0.2s" path="M24,87 C42,87 42,41 72,41" />
        </circle>
        <circle r="2.2" fill="var(--orange)" opacity="0.85">
          <animateMotion dur="1.1s" repeatCount="indefinite" begin="0.35s" path="M24,87 C42,87 42,133 72,133" />
        </circle>
      </svg>
      <span className="pl-fork-label">并行输出</span>
    </div>
  );
}

function StreamRow({ row, stream, activeId, onNodeClick }) {
  return (
    <div className="pl-stream-row">
      <div className="pl-stream-label">
        <span className="pl-stream-bar" style={{ background: row.color }} />
        <span className="pl-stream-text" style={{ color: row.color }}>{row.label}</span>
      </div>
      <div className="pl-stream-nodes">
        {row.nodes.map((node, i) => (
          <div key={node.id} className="pl-node-group">
            {i > 0 && <Arrow color={row.color} />}
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
        <Arrow color={row.color} className="pl-connecting-arrow" />
      </div>
    </div>
  );
}

export default function UnifiedPipeline({ activeId, onNodeClick }) {
  const pressureRow = pipelineRows.find(r => r.id === 'pressure');
  const postureRow = pipelineRows.find(r => r.id === 'posture');
  const joinNode = mergedNodes.find(n => n.id === 'join');
  const outputNodes = mergedNodes.filter(n => n.id !== 'join');

  return (
    <div className="unified-pipeline">
      <div className="pl-scroll">
        <div className="pl-canvas">
          <div className="pl-stage-labels">
            <div className="pl-stage-spacer" />
            {STAGES.map((stage) => (
              <div key={stage.id} className={`pl-stage-item pl-stage-${stage.id}`}>
                <span className="pl-stage-badge" style={{ color: stage.color, borderColor: `${stage.color}33` }}>
                  {stage.label}
                </span>
              </div>
            ))}
          </div>

          <div className="pl-body">
            <div className="pl-streams">
              <StreamRow row={pressureRow} stream="a" activeId={activeId} onNodeClick={onNodeClick} />
              <StreamRow row={postureRow} stream="b" activeId={activeId} onNodeClick={onNodeClick} />
            </div>

            <MergeConnector />

            <div className="pl-right-section">
              <div className="pl-merge-output-group">
                <div className="pl-join-col">
                  <PipelineNode
                    id={joinNode.id}
                    label={joinNode.label}
                    sub={joinNode.sub}
                    tag={joinNode.tag}
                    stream="merge"
                    active={activeId === joinNode.id}
                    onClick={onNodeClick}
                    inputCount={joinNode.inputCount}
                    outputCount={joinNode.outputCount}
                  />
                </div>
                <div className="pl-fork-col">
                  <ForkArrow />
                </div>
                <div className="pl-output-col">
                  {outputNodes.map(node => (
                    <PipelineNode
                      key={node.id}
                      id={node.id}
                      label={node.label}
                      sub={node.sub}
                      stream="out"
                      active={activeId === node.id}
                      onClick={onNodeClick}
                      inputCount={node.inputCount}
                      outputCount={node.outputCount}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
