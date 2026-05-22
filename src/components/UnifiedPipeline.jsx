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

const PIPE_OUTER = 8.5;
const PIPE_BODY = 4.8;
const PIPE_FLOW = 1.1;

function Arrow({ color, className = 'pl-arrow' }) {
  return (
    <div className={className}>
      <svg width="100%" height="20" viewBox="0 0 48 20" preserveAspectRatio="xMidYMid meet" fill="none">
        <path d="M0 10 H48" stroke={color} strokeWidth={PIPE_OUTER} strokeLinecap="round" opacity="0.16" />
        <path d="M0 10 H48" stroke={color} strokeWidth={PIPE_BODY} strokeLinecap="round" opacity="0.9" />
        <path d="M1 10 H47" stroke={color} strokeWidth={PIPE_FLOW} strokeDasharray="4 5" opacity="0.7">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
}

function MergeConnector() {
  const topPipe = 'M0 41 H44 C76 41 78 89 98 89';
  const bottomPipe = 'M0 137 H44 C76 137 78 89 98 89';
  const mergedPipe = 'M96 89 H120';

  return (
    <div className="pl-merge-connector">
      <svg viewBox="0 0 120 178" preserveAspectRatio="none" fill="none">
        <path d={topPipe} stroke="#6c8cff" strokeWidth={PIPE_OUTER} strokeLinecap="round" strokeLinejoin="round" opacity="0.16" />
        <path d={bottomPipe} stroke="#22d3ee" strokeWidth={PIPE_OUTER} strokeLinecap="round" strokeLinejoin="round" opacity="0.16" />
        <path d={mergedPipe} stroke="#34d399" strokeWidth={PIPE_OUTER} strokeLinecap="butt" opacity="0.18" />

        <path d={topPipe} stroke="#6c8cff" strokeWidth={PIPE_BODY} strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <path d={bottomPipe} stroke="#22d3ee" strokeWidth={PIPE_BODY} strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <path d={mergedPipe} stroke="#34d399" strokeWidth={PIPE_BODY} strokeLinecap="butt" opacity="0.95" />

        <path d={topPipe} stroke="#6c8cff" strokeWidth={PIPE_FLOW} strokeDasharray="4 5" opacity="0.7">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path d={bottomPipe} stroke="#22d3ee" strokeWidth={PIPE_FLOW} strokeDasharray="4 5" opacity="0.7">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path d={mergedPipe} stroke="#34d399" strokeWidth={PIPE_FLOW} strokeDasharray="4 5" opacity="0.72">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>
      </svg>
    </div>
  );
}

function ForkArrow() {
  const mergedPipe = 'M0 87 H24';
  const topPipe = 'M22 87 C38 87 39 41 72 41';
  const bottomPipe = 'M22 87 C38 87 39 133 72 133';

  return (
    <div className="pl-fork">
      <svg viewBox="0 0 72 174" preserveAspectRatio="none" fill="none">
        <path d={mergedPipe} stroke="var(--green)" strokeWidth={PIPE_OUTER} strokeLinecap="butt" opacity="0.18" />
        <path d={topPipe} stroke="var(--orange)" strokeWidth={PIPE_OUTER} strokeLinecap="round" strokeLinejoin="round" opacity="0.14" />
        <path d={bottomPipe} stroke="var(--orange)" strokeWidth={PIPE_OUTER} strokeLinecap="round" strokeLinejoin="round" opacity="0.14" />

        <path d={mergedPipe} stroke="var(--green)" strokeWidth={PIPE_BODY} strokeLinecap="butt" opacity="0.95" />
        <path d={topPipe} stroke="var(--orange)" strokeWidth={PIPE_BODY} strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
        <path d={bottomPipe} stroke="var(--orange)" strokeWidth={PIPE_BODY} strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />

        <path d={mergedPipe} stroke="var(--green)" strokeWidth={PIPE_FLOW} strokeDasharray="4 5" opacity="0.72">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path d={topPipe} stroke="var(--orange)" strokeWidth={PIPE_FLOW} strokeDasharray="4 5" fill="none" opacity="0.7">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>
        <path d={bottomPipe} stroke="var(--orange)" strokeWidth={PIPE_FLOW} strokeDasharray="4 5" fill="none" opacity="0.7">
          <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
        </path>
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
