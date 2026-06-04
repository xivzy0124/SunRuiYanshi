import PipelineNode from './PipelineNode';
import { pipelineRows, mergedNodes } from '../data/pipelineData';

// 阶段标签：顺序与每条流的节点列一一对应（共 12 列）
const STAGE_VARS = [
  { id: 'source', label: 'INPUT', cssVar: '--accent' },
  { id: 'parse', label: 'PARSE', cssVar: '--accent3' },
  { id: 'validate', label: 'VALIDATE', cssVar: '--cyan' },
  { id: 'filter', label: 'FILTER', cssVar: '--purple' },
  { id: 'dedup', label: 'DEDUP', cssVar: '--pink' },
  { id: 'clean', label: 'CLEAN', cssVar: '--green' },
  { id: 'map', label: 'MAP', cssVar: '--orange' },
  { id: 'normalize', label: 'NORMALIZE', cssVar: '--accent2' },
  { id: 'encode', label: 'ENCODE', cssVar: '--red' },
  { id: 'calc', label: 'CALC', cssVar: '--accent' },
  { id: 'aggregate', label: 'AGGREGATE', cssVar: '--cyan' },
  { id: 'quality', label: 'QUALITY', cssVar: '--purple' },
];

function getStages() {
  const style = getComputedStyle(document.documentElement);
  return STAGE_VARS.map((s) => ({
    ...s,
    color: style.getPropertyValue(s.cssVar).trim(),
  }));
}

const PIPE_OUTER = 11.5;
const PIPE_BODY = 6.8;
const PIPE_DOT = 2.1;

function FlowDots({ path, dur = 1.45, delay = 0 }) {
  return (
    <>
      <circle
        r={PIPE_DOT}
        fill="var(--text)"
        opacity="0.98"
      >
        <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${delay}s`} path={path} />
      </circle>
      <circle
        r={PIPE_DOT}
        fill="var(--text)"
        opacity="0.86"
      >
        <animateMotion
          dur={`${dur}s`}
          repeatCount="indefinite"
          begin={`${delay + dur / 2}s`}
          path={path}
        />
      </circle>
    </>
  );
}

function Arrow({ color, className = 'pl-arrow' }) {
  const pipe = 'M2 10 H46';

  return (
    <div className={className}>
      <svg
        width="100%"
        height="20"
        viewBox="0 0 48 20"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
      >
        <path
          d="M0 10 H48"
          stroke={color}
          strokeWidth={PIPE_OUTER}
          strokeLinecap="round"
          opacity="0.22"
        />
        <path
          d="M0 10 H48"
          stroke={color}
          strokeWidth={PIPE_BODY}
          strokeLinecap="round"
          opacity="1"
        />
        <FlowDots path={pipe} dur={1.1} />
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
        <path
          d={topPipe}
          stroke="var(--accent)"
          strokeWidth={PIPE_OUTER}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.22"
        />
        <path
          d={bottomPipe}
          stroke="var(--cyan)"
          strokeWidth={PIPE_OUTER}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.22"
        />
        <path
          d={mergedPipe}
          stroke="var(--green)"
          strokeWidth={PIPE_OUTER}
          strokeLinecap="butt"
          opacity="0.24"
        />

        <path
          d={topPipe}
          stroke="var(--accent)"
          strokeWidth={PIPE_BODY}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="1"
        />
        <path
          d={bottomPipe}
          stroke="var(--cyan)"
          strokeWidth={PIPE_BODY}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="1"
        />
        <path
          d={mergedPipe}
          stroke="var(--green)"
          strokeWidth={PIPE_BODY}
          strokeLinecap="butt"
          opacity="1"
        />

        <FlowDots path={topPipe} delay={0} />
        <FlowDots path={bottomPipe} delay={0.2} />
        <FlowDots path={mergedPipe} dur={1.1} delay={0.35} />
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
        <path
          d={mergedPipe}
          stroke="var(--green)"
          strokeWidth={PIPE_OUTER}
          strokeLinecap="butt"
          opacity="0.24"
        />
        <path
          d={topPipe}
          stroke="var(--orange)"
          strokeWidth={PIPE_OUTER}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.2"
        />
        <path
          d={bottomPipe}
          stroke="var(--orange)"
          strokeWidth={PIPE_OUTER}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.2"
        />

        <path
          d={mergedPipe}
          stroke="var(--green)"
          strokeWidth={PIPE_BODY}
          strokeLinecap="butt"
          opacity="1"
        />
        <path
          d={topPipe}
          stroke="var(--orange)"
          strokeWidth={PIPE_BODY}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="1"
        />
        <path
          d={bottomPipe}
          stroke="var(--orange)"
          strokeWidth={PIPE_BODY}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="1"
        />

        <FlowDots path={mergedPipe} dur={1.1} />
        <FlowDots path={topPipe} delay={0.2} />
        <FlowDots path={bottomPipe} delay={0.35} />
      </svg>
      <span className="pl-fork-label">并行输出</span>
    </div>
  );
}

function StreamRow({ row, stream, activeId, onNodeClick, baseDelay = 0 }) {
  return (
    <div className="pl-stream-row">
      <div className="pl-stream-label">
        <span className="pl-stream-bar" style={{ background: row.color }} />
        <span className="pl-stream-text" style={{ color: row.color }}>
          {row.label}
        </span>
      </div>
      <div className="pl-stream-nodes">
        {row.nodes.map((node, i) => (
          <div
            key={node.id}
            className="pl-node-group reveal-node"
            style={{ animationDelay: `${baseDelay + i * 0.18}s`, animationFillMode: 'both' }}
          >
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
  const pressureRow = pipelineRows.find((r) => r.id === 'pressure');
  const postureRow = pipelineRows.find((r) => r.id === 'posture');
  const mergeNodes = mergedNodes.filter((n) => n.stream === 'merge');
  const outputNodes = mergedNodes.filter((n) => n.stream === 'out');
  const stages = getStages();

  return (
    <div className="unified-pipeline">
      <div className="pl-scroll">
        <div className="pl-canvas">
          {/* 阶段标签：结构与下方 .pl-stream-nodes 完全同构，保证逐列对齐 */}
          <div className="pl-stage-labels">
            <div className="pl-stage-spacer" />
            <div className="pl-stage-track">
              {stages.map((stage, i) => (
                <div
                  key={stage.id}
                  className="pl-stage-cell reveal-node"
                  style={{ animationDelay: `${i * 0.15}s`, animationFillMode: 'both' }}
                >
                  {i > 0 && <span className="pl-stage-arrow-gap" />}
                  <span className="pl-stage-badge-wrap">
                    <span
                      className="pl-stage-badge"
                      style={{ color: stage.color, borderColor: `${stage.color}33` }}
                    >
                      {stage.label}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pl-body">
            <div className="pl-streams">
              <StreamRow
                row={pressureRow}
                stream="a"
                activeId={activeId}
                onNodeClick={onNodeClick}
                baseDelay={0.5}
              />
              <StreamRow
                row={postureRow}
                stream="b"
                activeId={activeId}
                onNodeClick={onNodeClick}
                baseDelay={1.5}
              />
            </div>

            <div className="reveal-node" style={{ animationDelay: '2.5s', animationFillMode: 'both' }}>
              <MergeConnector />
            </div>

            <div className="pl-right-section">
              <div className="pl-merge-output-group">
                <div className="pl-merge-nodes">
                  {mergeNodes.map((node, i) => (
                    <div
                      key={node.id}
                      className={`pl-merge-col reveal-node${node.tag ? ' pl-join-col' : ''}`}
                      style={{ animationDelay: `${3.0 + i * 0.4}s`, animationFillMode: 'both' }}
                    >
                      <PipelineNode
                        id={node.id}
                        label={node.label}
                        sub={node.sub}
                        tag={node.tag}
                        stream="merge"
                        active={activeId === node.id}
                        onClick={onNodeClick}
                        inputCount={node.inputCount}
                        outputCount={node.outputCount}
                      />
                    </div>
                  ))}
                </div>
                <div
                  className="pl-fork-col reveal-node"
                  style={{ animationDelay: `${3.0 + mergeNodes.length * 0.4 + 0.3}s`, animationFillMode: 'both' }}
                >
                  <ForkArrow />
                </div>
                <div className="pl-output-col">
                  {outputNodes.map((node, i) => (
                    <div
                      key={node.id}
                      className="reveal-node"
                      style={{ animationDelay: `${3.0 + mergeNodes.length * 0.4 + 0.8 + i * 0.3}s`, animationFillMode: 'both' }}
                    >
                      <PipelineNode
                        id={node.id}
                        label={node.label}
                        sub={node.sub}
                        stream="out"
                        active={activeId === node.id}
                        onClick={onNodeClick}
                        inputCount={node.inputCount}
                        outputCount={node.outputCount}
                      />
                    </div>
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
