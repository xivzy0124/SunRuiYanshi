import { useState, useRef, useCallback, useMemo } from 'react';
import fieldDetails from '../data/detailData';

// ─── Colors ───
const C = {
  accent: '#6c8cff',   // pressure
  accent2: '#22d3ee',  // posture
  green: '#34d399',    // join
  orange: '#fb923c',   // output
  accent3: '#a78bfa',  // calc
  muted: '#6b7084',
};

// ─── Stage columns ───
const STAGES = [
  { id: 'source', label: 'SOURCE',  x: 80,   w: 170, color: '#6c8cff' },
  { id: 'filter', label: 'FILTER',  x: 310,  w: 160, color: '#818cf8' },
  { id: 'map',    label: 'MAP',     x: 530,  w: 160, color: '#22d3ee' },
  { id: 'calc',   label: 'CALC',    x: 750,  w: 170, color: '#a78bfa' },
  { id: 'join',   label: 'JOIN',    x: 990,  w: 170, color: '#34d399' },
  { id: 'output', label: 'OUTPUT',  x: 1240, w: 210, color: '#fb923c' },
];

const SVG_W = 1500;
const SVG_H = 680;

// ─── Field Nodes ───
const INITIAL_NODES = {
  // ── Pressure Source ──
  'src:p:timestamp_ms':   { x: 80,  y: 75,  w: 170, h: 32, name: 'timestamp_ms',       type: 'int64',   color: C.accent, stage: 'source', pipeline: 'pressure' },
  'src:p:sensor_values':  { x: 80,  y: 115, w: 170, h: 32, name: 'sensor_values[18]',  type: 'float[]', color: C.accent, stage: 'source', pipeline: 'pressure' },
  'src:p:valid_frame':    { x: 80,  y: 155, w: 170, h: 32, name: 'valid_frame',        type: 'bool',    color: C.accent, stage: 'source', pipeline: 'pressure' },
  'src:p:raw_buffer':     { x: 80,  y: 195, w: 170, h: 32, name: 'raw_buffer',         type: 'bytes',   color: C.accent, stage: 'source', pipeline: 'pressure', dropped: true },
  'src:p:crc':            { x: 80,  y: 235, w: 170, h: 32, name: 'crc',                type: 'uint16',  color: C.accent, stage: 'source', pipeline: 'pressure', dropped: true },
  'src:p:device_id':      { x: 80,  y: 275, w: 170, h: 32, name: 'device_id',          type: 'string',  color: C.accent, stage: 'source', pipeline: 'pressure', dropped: true },

  // ── Pressure Filter ──
  'flt:p:timestamp_ms':   { x: 310, y: 95,  w: 160, h: 32, name: 'timestamp_ms',       type: 'int64',   color: C.accent, stage: 'filter', pipeline: 'pressure' },
  'flt:p:sensor_values':  { x: 310, y: 145, w: 160, h: 32, name: 'sensor_values[18]',  type: 'float[]', color: C.accent, stage: 'filter', pipeline: 'pressure' },

  // ── Pressure Map ──
  'map:p:ts':             { x: 530, y: 95,  w: 160, h: 32, name: 'ts',                 type: 'int64',   color: C.accent, stage: 'map', pipeline: 'pressure' },
  'map:p:pressure_data':  { x: 530, y: 145, w: 160, h: 32, name: 'pressure_data',      type: 'float[]', color: C.accent, stage: 'map', pipeline: 'pressure' },

  // ── Pressure Calc (6 fields) ──
  'calc:p:center_of_gravity': { x: 750, y: 55,  w: 170, h: 32, name: 'center_of_gravity', type: 'float', color: C.accent, stage: 'calc', pipeline: 'pressure' },
  'calc:p:cop_x':             { x: 750, y: 95,  w: 170, h: 32, name: 'cop_x',             type: 'float', color: C.accent, stage: 'calc', pipeline: 'pressure' },
  'calc:p:cop_y':             { x: 750, y: 135, w: 170, h: 32, name: 'cop_y',             type: 'float', color: C.accent, stage: 'calc', pipeline: 'pressure' },
  'calc:p:pressure_index':    { x: 750, y: 175, w: 170, h: 32, name: 'pressure_index',    type: 'float', color: C.accent, stage: 'calc', pipeline: 'pressure' },
  'calc:p:lr_balance':        { x: 750, y: 215, w: 170, h: 32, name: 'lr_balance',        type: 'float', color: C.accent, stage: 'calc', pipeline: 'pressure' },
  'calc:p:peak_pressure':     { x: 750, y: 255, w: 170, h: 32, name: 'peak_pressure',     type: 'float', color: C.accent, stage: 'calc', pipeline: 'pressure' },

  // ── Posture Source ──
  'src:o:frame_timestamp': { x: 80,  y: 385, w: 170, h: 32, name: 'frame_timestamp',          type: 'int64',   color: C.accent2, stage: 'source', pipeline: 'posture' },
  'src:o:landmarks_xyz':   { x: 80,  y: 425, w: 170, h: 32, name: 'landmarks[33].x/y/z',      type: 'float[]', color: C.accent2, stage: 'source', pipeline: 'posture' },
  'src:o:landmarks_vis':   { x: 80,  y: 465, w: 170, h: 32, name: 'landmarks[33].visibility', type: 'float[]', color: C.accent2, stage: 'source', pipeline: 'posture' },
  'src:o:model_version':   { x: 80,  y: 505, w: 170, h: 32, name: 'model_version',            type: 'string',  color: C.accent2, stage: 'source', pipeline: 'posture', dropped: true },
  'src:o:raw_inference':   { x: 80,  y: 545, w: 170, h: 32, name: 'raw_inference',            type: 'bytes',   color: C.accent2, stage: 'source', pipeline: 'posture', dropped: true },
  'src:o:device_info':     { x: 80,  y: 585, w: 170, h: 32, name: 'device_info',              type: 'object',  color: C.accent2, stage: 'source', pipeline: 'posture', dropped: true },

  // ── Posture Filter ──
  'flt:o:frame_timestamp': { x: 310, y: 405, w: 160, h: 32, name: 'frame_timestamp', type: 'int64',  color: C.accent2, stage: 'filter', pipeline: 'posture' },
  'flt:o:landmarks':       { x: 310, y: 460, w: 160, h: 32, name: 'landmarks[33]',   type: 'object', color: C.accent2, stage: 'filter', pipeline: 'posture' },

  // ── Posture Map ──
  'map:o:ts':        { x: 530, y: 405, w: 160, h: 32, name: 'ts',        type: 'int64',  color: C.accent2, stage: 'map', pipeline: 'posture' },
  'map:o:pose_data': { x: 530, y: 460, w: 160, h: 32, name: 'pose_data', type: 'object', color: C.accent2, stage: 'map', pipeline: 'posture' },

  // ── Posture Calc (6 fields) ──
  'calc:o:joint_angle':        { x: 750, y: 365, w: 170, h: 32, name: 'joint_angle',        type: 'float', color: C.accent2, stage: 'calc', pipeline: 'posture' },
  'calc:o:trunk_tilt':         { x: 750, y: 405, w: 170, h: 32, name: 'trunk_tilt',         type: 'float', color: C.accent2, stage: 'calc', pipeline: 'posture' },
  'calc:o:head_forward_angle': { x: 750, y: 445, w: 170, h: 32, name: 'head_forward_angle', type: 'float', color: C.accent2, stage: 'calc', pipeline: 'posture' },
  'calc:o:stride_angle':       { x: 750, y: 485, w: 170, h: 32, name: 'stride_angle',       type: 'float', color: C.accent2, stage: 'calc', pipeline: 'posture' },
  'calc:o:step_frequency':     { x: 750, y: 525, w: 170, h: 32, name: 'step_frequency',     type: 'float', color: C.accent2, stage: 'calc', pipeline: 'posture' },
  'calc:o:gait_speed':         { x: 750, y: 565, w: 170, h: 32, name: 'gait_speed',         type: 'float', color: C.accent2, stage: 'calc', pipeline: 'posture' },

  // ── Join ──
  'join:merged:ts':            { x: 990, y: 170, w: 170, h: 32, name: 'ts',               type: 'int64',   color: C.green, stage: 'join', pipeline: 'merged' },
  'join:merged:pressure_data': { x: 990, y: 215, w: 170, h: 32, name: 'pressure_data',    type: 'float[]', color: C.green, stage: 'join', pipeline: 'merged' },
  'join:merged:pose_data':     { x: 990, y: 260, w: 170, h: 32, name: 'pose_data',        type: 'object',  color: C.green, stage: 'join', pipeline: 'merged' },
  'join:merged:match_quality': { x: 990, y: 310, w: 170, h: 32, name: 'match_quality',    type: 'float',   color: C.green, stage: 'join', pipeline: 'merged' },
  'join:merged:calc_fields':   { x: 990, y: 365, w: 170, h: 32, name: 'calc fields (9)',  type: 'group',   color: C.green, stage: 'join', pipeline: 'merged' },

  // ── Output ──
  'out:db:t_fusion_health_dataset': { x: 1240, y: 210, w: 210, h: 32, name: 't_fusion_health_dataset', type: 'table',    color: C.orange, stage: 'output', pipeline: 'merged' },
  'out:api:latest':                 { x: 1240, y: 330, w: 210, h: 32, name: '/api/v1/latest',        type: 'endpoint', color: C.orange, stage: 'output', pipeline: 'merged' },
  'out:api:query':                  { x: 1240, y: 380, w: 210, h: 32, name: '/api/v1/query',         type: 'endpoint', color: C.orange, stage: 'output', pipeline: 'merged' },
};

// ─── Edges ───
const EDGES = [
  // Passthrough: source → filter
  { from: 'src:p:timestamp_ms',  to: 'flt:p:timestamp_ms',  color: C.accent,  label: 'pass', transformType: 'passthrough' },
  { from: 'src:p:sensor_values', to: 'flt:p:sensor_values', color: C.accent,  label: 'pass', transformType: 'passthrough' },
  { from: 'src:o:frame_timestamp', to: 'flt:o:frame_timestamp', color: C.accent2, label: 'pass', transformType: 'passthrough' },
  { from: 'src:o:landmarks_xyz', to: 'flt:o:landmarks', color: C.accent2, label: 'merge w/ visibility', transformType: 'merge' },
  { from: 'src:o:landmarks_vis', to: 'flt:o:landmarks', color: C.accent2, label: 'merge w/ x/y/z', transformType: 'merge' },

  // Rename: filter → map
  { from: 'flt:p:timestamp_ms',  to: 'map:p:ts',            color: C.accent,  label: 'timestamp_ms → ts', transformType: 'rename' },
  { from: 'flt:p:sensor_values', to: 'map:p:pressure_data', color: C.accent,  label: 'sensor_values → pressure_data', transformType: 'rename' },
  { from: 'flt:o:frame_timestamp', to: 'map:o:ts',          color: C.accent2, label: 'frame_timestamp → ts', transformType: 'rename' },
  { from: 'flt:o:landmarks',     to: 'map:o:pose_data',     color: C.accent2, label: 'landmarks → pose_data', transformType: 'rename' },

  // Derive: map → calc (pressure, 6 fields)
  { from: 'map:p:pressure_data', to: 'calc:p:center_of_gravity', color: C.accent, label: 'weighted_avg', transformType: 'derive' },
  { from: 'map:p:pressure_data', to: 'calc:p:cop_x',             color: C.accent, label: 'sum(p*x)/sum(p)', transformType: 'derive' },
  { from: 'map:p:pressure_data', to: 'calc:p:cop_y',             color: C.accent, label: 'sum(p*y)/sum(p)', transformType: 'derive' },
  { from: 'map:p:pressure_data', to: 'calc:p:pressure_index',    color: C.accent, label: 'std/mean', transformType: 'derive' },
  { from: 'map:p:pressure_data', to: 'calc:p:lr_balance',        color: C.accent, label: 'left/all', transformType: 'derive' },
  { from: 'map:p:pressure_data', to: 'calc:p:peak_pressure',     color: C.accent, label: 'max(data)', transformType: 'derive' },

  // Derive: map → calc (posture, 6 fields)
  { from: 'map:o:pose_data', to: 'calc:o:joint_angle',        color: C.accent2, label: 'acos(dot/|v|)', transformType: 'derive' },
  { from: 'map:o:pose_data', to: 'calc:o:trunk_tilt',         color: C.accent2, label: 'atan2(s-h)', transformType: 'derive' },
  { from: 'map:o:pose_data', to: 'calc:o:head_forward_angle', color: C.accent2, label: 'angle(n,s,h)', transformType: 'derive' },
  { from: 'map:o:pose_data', to: 'calc:o:stride_angle',       color: C.accent2, label: 'acos(hip_knee)', transformType: 'derive' },
  { from: 'map:o:pose_data', to: 'calc:o:step_frequency',     color: C.accent2, label: '60/mean(peak)', transformType: 'derive' },
  { from: 'map:o:pose_data', to: 'calc:o:gait_speed',         color: C.accent2, label: 'delta(hip)*fps', transformType: 'derive' },

  // Merge: map → join
  { from: 'map:p:ts',            to: 'join:merged:ts',            color: C.green, label: 'merge key (L)', transformType: 'merge' },
  { from: 'map:o:ts',            to: 'join:merged:ts',            color: C.green, label: 'merge key (R), 50ms', transformType: 'merge' },
  { from: 'map:p:pressure_data', to: 'join:merged:pressure_data', color: C.green, label: 'from pressure', transformType: 'carry' },
  { from: 'map:o:pose_data',     to: 'join:merged:pose_data',     color: C.green, label: 'from posture', transformType: 'carry' },

  // Carry: calc → join (dashed)
  { from: 'calc:p:center_of_gravity', to: 'join:merged:calc_fields', color: C.accent,  label: 'carry', transformType: 'carry', dashed: true },
  { from: 'calc:p:cop_x',             to: 'join:merged:calc_fields', color: C.accent,  label: 'carry', transformType: 'carry', dashed: true },
  { from: 'calc:p:cop_y',             to: 'join:merged:calc_fields', color: C.accent,  label: 'carry', transformType: 'carry', dashed: true },
  { from: 'calc:p:pressure_index',    to: 'join:merged:calc_fields', color: C.accent,  label: 'carry', transformType: 'carry', dashed: true },
  { from: 'calc:p:lr_balance',        to: 'join:merged:calc_fields', color: C.accent,  label: 'carry', transformType: 'carry', dashed: true },
  { from: 'calc:p:peak_pressure',     to: 'join:merged:calc_fields', color: C.accent,  label: 'carry', transformType: 'carry', dashed: true },
  { from: 'calc:o:joint_angle',        to: 'join:merged:calc_fields', color: C.accent2, label: 'carry', transformType: 'carry', dashed: true },
  { from: 'calc:o:trunk_tilt',         to: 'join:merged:calc_fields', color: C.accent2, label: 'carry', transformType: 'carry', dashed: true },
  { from: 'calc:o:head_forward_angle', to: 'join:merged:calc_fields', color: C.accent2, label: 'carry', transformType: 'carry', dashed: true },
  { from: 'calc:o:stride_angle',       to: 'join:merged:calc_fields', color: C.accent2, label: 'carry', transformType: 'carry', dashed: true },
  { from: 'calc:o:step_frequency',     to: 'join:merged:calc_fields', color: C.accent2, label: 'carry', transformType: 'carry', dashed: true },
  { from: 'calc:o:gait_speed',         to: 'join:merged:calc_fields', color: C.accent2, label: 'carry', transformType: 'carry', dashed: true },

  // Output: join → output
  { from: 'join:merged:ts',            to: 'out:db:t_fusion_health_dataset', color: C.orange, label: 'indexed: ts, session_id', transformType: 'output' },
  { from: 'join:merged:ts',            to: 'out:api:latest',                 color: C.orange, label: 'GET /api/v1/latest', transformType: 'output' },
  { from: 'join:merged:ts',            to: 'out:api:query',                  color: C.orange, label: 'POST /api/v1/query', transformType: 'output' },
  { from: 'join:merged:calc_fields',   to: 'out:db:t_fusion_health_dataset', color: C.green,  label: 'all 9 fields persisted', transformType: 'output' },
];

// ─── Helpers ───
function makePath(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

function computeLineageChain(selectedId, edges) {
  const upstream = new Set();
  const downstream = new Set();
  let queue = [selectedId];
  let visited = new Set([selectedId]);
  while (queue.length) {
    const current = queue.shift();
    for (const edge of edges) {
      if (edge.to === current && !visited.has(edge.from)) {
        visited.add(edge.from);
        upstream.add(edge.from);
        queue.push(edge.from);
      }
    }
  }
  queue = [selectedId];
  visited = new Set([selectedId]);
  while (queue.length) {
    const current = queue.shift();
    for (const edge of edges) {
      if (edge.from === current && !visited.has(edge.to)) {
        visited.add(edge.to);
        downstream.add(edge.to);
        queue.push(edge.to);
      }
    }
  }
  return {
    chain: new Set([selectedId, ...upstream, ...downstream]),
    upstream,
    downstream,
  };
}

const STAGE_LABELS = {
  source: 'Source',
  filter: 'Filter',
  map: 'Map',
  calc: 'Calc',
  join: 'Join',
  output: 'Output',
};

const PIPELINE_LABELS = {
  pressure: '足底压力管线',
  posture: '三维姿态管线',
  merged: '融合输出',
};

const TRANSFORM_ICONS = {
  passthrough: { icon: '→', bg: 'rgba(108,140,255,0.15)', fg: '#6c8cff' },
  rename:      { icon: '⇄', bg: 'rgba(34,211,238,0.15)',  fg: '#22d3ee' },
  derive:      { icon: 'ƒ', bg: 'rgba(167,139,250,0.15)', fg: '#a78bfa' },
  merge:       { icon: '⨝', bg: 'rgba(52,211,153,0.15)',  fg: '#34d399' },
  carry:       { icon: '↓', bg: 'rgba(107,112,132,0.15)', fg: '#6b7084' },
  output:      { icon: '◉', bg: 'rgba(251,146,60,0.15)',  fg: '#fb923c' },
  persist:     { icon: 'D', bg: 'rgba(251,146,60,0.15)',  fg: '#fb923c' },
  expose:      { icon: 'A', bg: 'rgba(251,146,60,0.15)',  fg: '#fb923c' },
};

function FlowParticle({ path, color, dur = 2.5, delay = 0, opacity = 0.8 }) {
  return (
    <circle r="2.4" fill={color} opacity={opacity}>
      <animateMotion
        dur={`${dur}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={path}
      />
    </circle>
  );
}

export default function LineageGraph() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [selected, setSelected] = useState(null);
  const [hoverEdge, setHoverEdge] = useState(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);

  const chain = useMemo(
    () => selected ? computeLineageChain(selected, EDGES) : null,
    [selected],
  );

  const getSvgPoint = useCallback((e) => {
    const svg = e.currentTarget.closest('svg');
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }, []);

  const handlePointerDown = useCallback((id, e) => {
    e.stopPropagation();
    const pt = getSvgPoint(e);
    dragRef.current = { id, ox: nodes[id].x, oy: nodes[id].y, sx: pt.x, sy: pt.y };
    movedRef.current = false;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [nodes, getSvgPoint]);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const pt = getSvgPoint(e);
    const { id, ox, oy, sx, sy } = dragRef.current;
    const dx = pt.x - sx;
    const dy = pt.y - sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
    setNodes(prev => ({
      ...prev,
      [id]: { ...prev[id], x: ox + dx, y: oy + dy },
    }));
  }, [getSvgPoint]);

  const handlePointerUp = useCallback((id) => {
    if (dragRef.current && !movedRef.current) {
      setSelected(prev => (prev === id ? null : id));
    }
    dragRef.current = null;
  }, []);

  const handleBgClick = useCallback(() => {
    setSelected(null);
  }, []);

  return (
    <div className="lineage-section">
        <div className="lineage-svg">
          <svg
            width={SVG_W}
            height={SVG_H}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            onClick={handleBgClick}
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1e2c" strokeWidth="0.5" />
              </pattern>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-strong">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <linearGradient id="stage-band-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Background */}
            <rect width={SVG_W} height={SVG_H} fill="url(#grid)" rx="8" />

            {/* Stage column background bands */}
            {STAGES.map((stage, i) => {
              const nextX = i < STAGES.length - 1 ? STAGES[i + 1].x : SVG_W;
              const bandW = nextX - stage.x;
              return (
                <g key={stage.id}>
                  <rect
                    x={stage.x - 10}
                    y={38}
                    width={bandW + 10}
                    height={SVG_H - 48}
                    fill={stage.color}
                    opacity="0.02"
                    rx="4"
                  />
                  {/* Stage header bar */}
                  <rect
                    x={stage.x - 10}
                    y={6}
                    width={bandW + 10}
                    height={26}
                    fill={stage.color}
                    opacity="0.1"
                    rx="4"
                  />
                  <line
                    x1={stage.x - 10}
                    y1={32}
                    x2={stage.x - 10 + bandW + 10}
                    y2={32}
                    stroke={stage.color}
                    strokeWidth="1"
                    opacity="0.2"
                  />
                  <text
                    x={stage.x - 10 + (bandW + 10) / 2}
                    y={22}
                    textAnchor="middle"
                    fill={stage.color}
                    fontSize="11"
                    fontWeight="700"
                    letterSpacing="2"
                  >
                    {stage.label}
                  </text>
                  {/* Stage record count badge */}
                  {stage.id !== 'source' && (
                    <text
                      x={stage.x - 10 + (bandW + 10) / 2}
                      y={SVG_H - 10}
                      textAnchor="middle"
                      fill={stage.color}
                      fontSize="9"
                      opacity="0.4"
                      fontFamily="'Cascadia Code', monospace"
                    >
                      {stage.id === 'filter' && '10752→9238 / 8144→6947'}
                      {stage.id === 'map' && '9238→9107 / 6947→6835'}
                      {stage.id === 'calc' && '6 + 6 = 12 fields'}
                      {stage.id === 'join' && '9107+6835→6218 (68.3%)'}
                      {stage.id === 'output' && '6218 records'}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Stage column dividers */}
            {STAGES.slice(0, -1).map((stage, i) => {
              return (
                <line
                  key={stage.id}
                  x1={(stage.x + STAGES[i + 1].x) / 2 + (stage.w + STAGES[i + 1].w) / 4}
                  y1={38}
                  x2={(stage.x + STAGES[i + 1].x) / 2 + (stage.w + STAGES[i + 1].w) / 4}
                  y2={SVG_H - 20}
                  stroke="#1a1e2c"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Pipeline group labels */}
            <g>
              <rect x={4} y={75} width={4} height={232} rx="2" fill={C.accent} opacity="0.6" />
              <text x={14} y={160} fill={C.accent} fontSize="10" fontWeight="700" letterSpacing="1" opacity="0.5"
                transform="rotate(-90, 14, 160)">
                PRESSURE
              </text>
            </g>
            <g>
              <rect x={4} y={385} width={4} height={232} rx="2" fill={C.accent2} opacity="0.6" />
              <text x={14} y={470} fill={C.accent2} fontSize="10" fontWeight="700" letterSpacing="1" opacity="0.5"
                transform="rotate(-90, 14, 470)">
                POSTURE
              </text>
            </g>
            <g>
              <rect x={986} y={170} width={4} height={227} rx="2" fill={C.green} opacity="0.6" />
              <text x={996} y={280} fill={C.green} fontSize="10" fontWeight="700" letterSpacing="1" opacity="0.5"
                transform="rotate(-90, 996, 280)">
                MERGED
              </text>
            </g>

            {/* Pipeline group separator line */}
            <line x1={80} y1={335} x2={920} y2={335} stroke="#1e2235" strokeWidth="1.5" strokeDasharray="6 4" />

            {/* Edges */}
            {EDGES.map((edge, i) => {
              const from = nodes[edge.from];
              const to = nodes[edge.to];
              if (!from || !to) return null;
              const x1 = from.x + from.w;
              const y1 = from.y + from.h / 2;
              const x2 = to.x;
              const y2 = to.y + to.h / 2;
              const path = makePath(x1, y1, x2, y2);
              const isHovered = hoverEdge === i;

              // Lineage chain highlighting
              let edgeOpacity = 0.3;
              let edgeWidth = 1.8;
              if (chain) {
                const fromInChain = chain.chain.has(edge.from);
                const toInChain = chain.chain.has(edge.to);
                if (fromInChain && toInChain) {
                  edgeOpacity = 0.95;
                  edgeWidth = 2.5;
                } else if (fromInChain || toInChain) {
                  edgeOpacity = 0.4;
                } else {
                  edgeOpacity = 0.08;
                }
              } else if (isHovered) {
                edgeOpacity = 0.95;
                edgeWidth = 2.5;
              }

              return (
                <g key={i}>
                  <path
                    d={path}
                    fill="none"
                    stroke={edge.color}
                    strokeWidth={isHovered ? 3 : edgeWidth}
                    strokeOpacity={edgeOpacity}
                    strokeDasharray={edge.dashed ? '6 4' : undefined}
                    className="lineage-edge"
                    onMouseEnter={() => setHoverEdge(i)}
                    onMouseLeave={() => setHoverEdge(null)}
                    style={{ cursor: 'pointer', transition: 'stroke-opacity 0.2s, stroke-width 0.2s' }}
                  />
                  <FlowParticle path={path} color={edge.color} delay={0} opacity={Math.max(edgeOpacity, 0.35)} />
                  <FlowParticle path={path} color={edge.color} delay={1.2} opacity={Math.max(edgeOpacity, 0.35)} />
                  {isHovered && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 10}
                      textAnchor="middle"
                      fill={edge.color}
                      fontSize="10"
                      fontWeight="600"
                      className="edge-label"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Field nodes */}
            {Object.entries(nodes).map(([id, node]) => {
              const isSelected = selected === id;
              const isInChain = chain?.chain.has(id);
              const dimmed = chain && !isInChain && !isSelected;

              return (
                <g
                  key={id}
                  className={`field-node${isSelected ? ' selected' : ''}${dimmed ? ' dimmed' : ''}${isInChain && !isSelected ? ' in-chain' : ''}`}
                  onPointerDown={(e) => handlePointerDown(id, e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={() => handlePointerUp(id)}
                  style={{ cursor: 'grab' }}
                >
                  {/* Hit area */}
                  <rect
                    x={node.x - 4}
                    y={node.y - 4}
                    width={node.w + 8}
                    height={node.h + 8}
                    fill="transparent"
                  />
                  {/* Selection glow */}
                  {isSelected && (
                    <rect
                      x={node.x - 4}
                      y={node.y - 4}
                      width={node.w + 8}
                      height={node.h + 8}
                      rx={8}
                      fill="none"
                      stroke={node.color}
                      strokeWidth="2"
                      opacity="0.5"
                      filter="url(#glow-strong)"
                    />
                  )}
                  {/* Card shadow */}
                  <rect
                    x={node.x + 1}
                    y={node.y + 1}
                    width={node.w}
                    height={node.h}
                    rx="5"
                    fill="rgba(0,0,0,0.3)"
                  />
                  {/* Card */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.w}
                    height={node.h}
                    rx="5"
                    fill={isSelected ? '#1e2235' : '#181b24'}
                    stroke={node.color}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{ transition: 'stroke-width 0.15s' }}
                  />
                  {/* Left accent bar */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width="4"
                    height={node.h}
                    rx="2"
                    fill={node.color}
                    opacity={node.dropped ? 0.25 : 0.85}
                  />
                  {/* Field name */}
                  <text
                    x={node.x + 12}
                    y={node.y + node.h / 2 + 1}
                    dominantBaseline="central"
                    fill={node.dropped ? '#4a5068' : '#e4e6ee'}
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="'Cascadia Code', 'Fira Code', monospace"
                    style={node.dropped ? { textDecoration: 'line-through' } : undefined}
                  >
                    {node.name}
                  </text>
                  {/* Type badge */}
                  {!node.dropped && (
                    <text
                      x={node.x + node.w - 8}
                      y={node.y + node.h / 2 + 1}
                      textAnchor="end"
                      dominantBaseline="central"
                      fontSize="9"
                      fontFamily="'Cascadia Code', 'Fira Code', monospace"
                      fill="#6b7084"
                      opacity="0.7"
                    >
                      {node.type}
                    </text>
                  )}
                  {/* Dropped X marker */}
                  {node.dropped && (
                    <text
                      x={node.x + node.w - 8}
                      y={node.y + node.h / 2 + 1}
                      textAnchor="end"
                      dominantBaseline="central"
                      className="field-dropped-x"
                    >
                      ✕
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detail Panel */}
        {selected && fieldDetails[selected] && (
          <div className="lineage-field-detail">
            <div className="lineage-field-detail-header">
              <h4>{fieldDetails[selected].title}</h4>
              <span
                className="field-type-label"
                style={{
                  background: `${nodes[selected]?.color || C.accent}18`,
                  color: nodes[selected]?.color || C.accent,
                }}
              >
                {fieldDetails[selected].fieldType}
              </span>
              <button className="detail-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="lineage-field-detail-meta">
              <span>Stage: <strong>{STAGE_LABELS[fieldDetails[selected].stage] || fieldDetails[selected].stage}</strong></span>
              <span>Pipeline: <strong>{PIPELINE_LABELS[fieldDetails[selected].pipeline] || fieldDetails[selected].pipeline}</strong></span>
            </div>
            <div
              className="lineage-field-detail-body"
              dangerouslySetInnerHTML={{
                __html: fieldDetails[selected].body.replace(/<\/?p>/g, ''),
              }}
            />

            {/* Transform block */}
            {fieldDetails[selected].transform && (() => {
              const t = fieldDetails[selected].transform;
              const ti = TRANSFORM_ICONS[t.type] || TRANSFORM_ICONS.carry;
              return (
                <div className="lineage-transform-block">
                  <span className="lineage-transform-icon" style={{ background: ti.bg, color: ti.fg }}>
                    {ti.icon}
                  </span>
                  <div className="lineage-transform-content">
                    <div className="lineage-transform-label">
                      {t.type === 'rename' && `${t.from} → ${t.to}`}
                      {t.type === 'derive' && t.formula}
                      {t.type === 'passthrough' && `Filter: ${t.rule}`}
                      {t.type === 'merge' && (t.rule || `Merge: ${t.joinKey}, ${t.tolerance}`)}
                      {t.type === 'carry' && `Carry from ${t.from}`}
                      {t.type === 'persist' && `Persist: ${t.mode}, batch ${t.batchSize}`}
                      {t.type === 'expose' && `${t.method} ${t.path}`}
                    </div>
                    <div className="lineage-transform-detail">
                      {t.type}
                      {t.unit && ` · ${t.unit}`}
                      {t.precision && ` · precision ${t.precision}`}
                      {t.retention && ` · retention ${t.retention}`}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Lineage chain */}
            {chain && (chain.upstream.size > 0 || chain.downstream.size > 0) && (
              <div className="lineage-chain-section">
                {chain.upstream.size > 0 && (
                  <>
                    <h5>Upstream</h5>
                    <div className="lineage-chain-list">
                      {[...chain.upstream].map(uid => (
                        <span
                          key={uid}
                          className="lineage-chain-tag upstream"
                          onClick={(e) => { e.stopPropagation(); setSelected(uid); }}
                        >
                          {nodes[uid]?.name || uid}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                {chain.downstream.size > 0 && (
                  <>
                    <h5 style={{ marginTop: chain.upstream.size > 0 ? 8 : 0 }}>Downstream</h5>
                    <div className="lineage-chain-list">
                      {[...chain.downstream].map(did => (
                        <span
                          key={did}
                          className="lineage-chain-tag downstream"
                          onClick={(e) => { e.stopPropagation(); setSelected(did); }}
                        >
                          {nodes[did]?.name || did}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Code block */}
            {fieldDetails[selected].code && (
              <div style={{ padding: '8px 16px 12px' }}>
                <pre
                  style={{
                    margin: 0,
                    padding: '10px 14px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 11,
                    lineHeight: 1.6,
                    color: '#e4e6ee',
                    overflow: 'auto',
                    fontFamily: "'Cascadia Code', 'Fira Code', monospace",
                  }}
                  dangerouslySetInnerHTML={{ __html: fieldDetails[selected].code }}
                />
              </div>
            )}
          </div>
        )}
    </div>
  );
}
