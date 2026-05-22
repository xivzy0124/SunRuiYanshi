import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/mockWorkbench.css';

const STANDING_LANDMARKS = {
  nose: [0.5, 0.082, -0.02],
  left_eye_inner: [0.488, 0.072, -0.01],
  left_eye: [0.482, 0.072, -0.01],
  left_eye_outer: [0.476, 0.072, -0.01],
  right_eye_inner: [0.512, 0.072, -0.01],
  right_eye: [0.518, 0.072, -0.01],
  right_eye_outer: [0.524, 0.072, -0.01],
  left_ear: [0.462, 0.085, -0.03],
  right_ear: [0.538, 0.085, -0.03],
  mouth_left: [0.488, 0.098, -0.01],
  mouth_right: [0.512, 0.098, -0.01],
  left_shoulder: [0.41, 0.22, -0.06],
  right_shoulder: [0.59, 0.22, -0.06],
  left_elbow: [0.37, 0.35, -0.08],
  right_elbow: [0.63, 0.35, -0.08],
  left_wrist: [0.36, 0.47, -0.1],
  right_wrist: [0.64, 0.47, -0.1],
  left_pinky: [0.35, 0.48, -0.1],
  right_pinky: [0.65, 0.48, -0.1],
  left_index: [0.355, 0.48, -0.1],
  right_index: [0.645, 0.48, -0.1],
  left_thumb: [0.365, 0.465, -0.1],
  right_thumb: [0.635, 0.465, -0.1],
  left_hip: [0.445, 0.48, -0.02],
  right_hip: [0.555, 0.48, -0.02],
  left_knee: [0.44, 0.62, 0.01],
  right_knee: [0.56, 0.62, 0.01],
  left_ankle: [0.438, 0.77, 0.02],
  right_ankle: [0.562, 0.77, 0.02],
  left_heel: [0.435, 0.79, 0.03],
  right_heel: [0.565, 0.79, 0.03],
  left_foot_index: [0.43, 0.81, 0.01],
  right_foot_index: [0.57, 0.81, 0.01],
};

const BONES = [
  ['nose', 'left_eye_inner'], ['nose', 'right_eye_inner'],
  ['left_eye_inner', 'left_eye'], ['left_eye', 'left_eye_outer'],
  ['right_eye_inner', 'right_eye'], ['right_eye', 'right_eye_outer'],
  ['left_eye_outer', 'left_ear'], ['right_eye_outer', 'right_ear'],
  ['mouth_left', 'mouth_right'],
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  ['left_wrist', 'left_pinky'], ['left_wrist', 'left_index'], ['left_wrist', 'left_thumb'],
  ['right_wrist', 'right_pinky'], ['right_wrist', 'right_index'], ['right_wrist', 'right_thumb'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'],
  ['left_ankle', 'left_heel'], ['right_ankle', 'right_heel'],
  ['left_heel', 'left_foot_index'], ['right_heel', 'right_foot_index'],
];

const METRICS_DEF = [
  { name: '头前倾角', key: 'head_tilt_deg', unit: '°', lo: 0, hi: 5, group: '姿态角度' },
  { name: '颈侧倾角', key: 'shoulder_tilt_deg', unit: '°', lo: 0, hi: 2, group: '姿态角度' },
  { name: '颈旋转角', key: 'pelvis_tilt_deg', unit: '°', lo: 0, hi: 5, group: '姿态角度' },
  { name: '肩倾斜角', key: 'trunk_shift_percent', unit: '°', lo: 0, hi: 2, group: '姿态角度' },
  { name: '总身高', key: 'total_height', unit: '', lo: 0.6, hi: 1.0, group: '身体尺度' },
  { name: '肩宽', key: 'shoulder_width', unit: '', lo: 0.1, hi: 0.4, group: '身体尺度' },
  { name: '髋宽', key: 'hip_width', unit: '', lo: 0.08, hi: 0.3, group: '身体尺度' },
  { name: '躯干长', key: 'torso_length', unit: '', lo: 0.2, hi: 0.5, group: '身体尺度' },
  { name: '腿长', key: 'leg_length', unit: '', lo: 0.3, hi: 0.6, group: '身体尺度' },
  { name: '臂长', key: 'arm_length', unit: '', lo: 0.15, hi: 0.45, group: '身体尺度' },
  { name: '头宽', key: 'head_width', unit: '', lo: 0.08, hi: 0.18, group: '身体尺度' },
  { name: '头部中心X', key: 'head_center_x', unit: '', lo: 0.3, hi: 0.7, group: '中心对齐' },
  { name: '肩中心X', key: 'shoulder_center_x', unit: '', lo: 0.3, hi: 0.7, group: '中心对齐' },
  { name: '肩跨度', key: 'shoulder_span', unit: '', lo: 0.15, hi: 0.4, group: '中心对齐' },
];

const LEFT_ZONES = [
  'forefootBottomLateral', 'forefootTopLateral', 'forefootBottomOuterMid', 'forefootTopOuterMid',
  'forefootBottomInnerMid', 'forefootTopInnerMid', 'forefootBottomMedial', 'forefootTopMedial',
  'midfootBottomLateral', 'midfootTopLateral', 'midfootBottomCenter', 'midfootTopCenter',
  'midfootBottomMedial', 'midfootTopMedial',
  'heelBottomLateral', 'heelTopLateral', 'heelBottomMedial', 'heelTopMedial',
];

const RIGHT_ZONES = [
  'forefootBottomMedial', 'forefootTopMedial', 'forefootBottomInnerMid', 'forefootTopInnerMid',
  'forefootBottomOuterMid', 'forefootTopOuterMid', 'forefootBottomLateral', 'forefootTopLateral',
  'midfootBottomMedial', 'midfootTopMedial', 'midfootBottomCenter', 'midfootTopCenter',
  'midfootBottomLateral', 'midfootTopLateral',
  'heelBottomMedial', 'heelTopMedial', 'heelBottomLateral', 'heelTopLateral',
];

const ZONE_LABELS = {
  forefootTopMedial: '前掌上-内', forefootTopInnerMid: '前掌上-内中', forefootTopOuterMid: '前掌上-外中', forefootTopLateral: '前掌上-外',
  forefootBottomMedial: '前掌下-内', forefootBottomInnerMid: '前掌下-内中', forefootBottomOuterMid: '前掌下-外中', forefootBottomLateral: '前掌下-外',
  midfootTopMedial: '中足上-内', midfootTopCenter: '中足上-中', midfootTopLateral: '中足上-外',
  midfootBottomMedial: '中足下-内', midfootBottomCenter: '中足下-中', midfootBottomLateral: '中足下-外',
  heelTopMedial: '后跟上-内', heelTopLateral: '后跟上-外', heelBottomMedial: '后跟下-内', heelBottomLateral: '后跟下-外',
};

const FOOT_ROW_SIZES = [4, 4, 3, 3, 2, 2];

const AI_RESPONSE = `收到自然语言指令后，我已将任务拆解为一次完整的力姿数据 ETL 编排，并自动生成可执行的数据处理链路。首先，系统识别到本次任务包含两路异构输入：一路是足底压力 API，负责接收左右脚 18 区传感器采样值、压力时间戳、左右脚匹配状态与设备侧原始帧；另一路是三维姿态 API，负责接收 33 个关键点坐标、visibility 置信度、骨架检测状态、帧率与姿态指标。随后我为两路数据分别建立 source schema，统一 session_id、user_id、pose_timestamp 和毫秒级 ts 字段，确保后续可以按同一时间基准做融合。

进入清洗阶段后，压力流会依次剔除无效帧、空数组、缺失脚别、传感器长度异常、ADC 读数越界和明显跳变值；姿态流会校验 body_detected、tracking_ready、关键点数量、visibility 阈值以及 x/y/z 坐标范围，低置信帧会被标记或丢弃。字段映射阶段会把 sensor_values 标准化为 pressure_data，把 left_pressures_json 与 right_pressures_json 拆解为左右脚结构，把 landmarks_xyz、world_landmarks 和 visibility 规整成 pose_data，并补齐字段类型、单位、来源说明和质量标签。

计算阶段会自动派生足底压力重心、COP 坐标、左右平衡、峰值压力、压力分布指数、前后掌负载比例，同时从姿态数据中计算头前倾、肩倾斜、骨盆旋转、躯干侧移、关节夹角、步频、步态速度等特征。最后我使用 50ms nearest 策略执行双流 JOIN，只保留同一时间窗口内压力与姿态都有效的同步帧，并生成匹配质量分数。处理完成后，融合结果会并行写入标准化数据集并发布 RESTful 查询接口，供看板、报告和后续 AI 分析调用。接下来打开数据治理流水线，展示这次自然语言生成的完整处理链路。`;

function randomBetween(min, max, precision = 3) {
  return Number((min + Math.random() * (max - min)).toFixed(precision));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatMetric(value, unit) {
  if (typeof value !== 'number') return '-';
  const precision = unit === '°' ? 1 : 3;
  return `${value.toFixed(precision)}${unit}`;
}

function buildMetricRow(metric, sample) {
  const value = sample?.[metric.key] ?? 0;
  const inRange = value >= metric.lo && value <= metric.hi;
  const axisMax = Math.max(metric.hi * 1.35, value * 1.08, metric.hi + 0.01);
  const normalLeft = clamp((metric.lo / axisMax) * 100, 0, 100);
  const normalWidth = clamp(((metric.hi - metric.lo) / axisMax) * 100, 4, 100 - normalLeft);
  const markerLeft = clamp((value / axisMax) * 100, 0, 100);
  const status = inRange ? '正常' : value < metric.lo ? '偏低' : '偏高';

  return {
    ...metric,
    value,
    inRange,
    status,
    formattedValue: formatMetric(value, metric.unit),
    rangeText: `${formatMetric(metric.lo, metric.unit)} - ${formatMetric(metric.hi, metric.unit)}`,
    normalLeft,
    normalWidth,
    markerLeft,
  };
}

function randomSampleCount() {
  return Math.floor(Math.random() * 4) + 2;
}

function chunkFootZones(zones) {
  return FOOT_ROW_SIZES.map((size, rowIndex) => {
    const start = FOOT_ROW_SIZES.slice(0, rowIndex).reduce((sum, current) => sum + current, 0);
    return zones.slice(start, start + size);
  });
}

function jitter(value, amount = 0.006) {
  return Number((value + (Math.random() * 2 - 1) * amount).toFixed(4));
}

function genPressures() {
  const ranges = [
    [800, 2500], [600, 2000], [400, 1500], [300, 1200],
    [1000, 3000], [800, 2500], [500, 1800], [300, 1200],
    [0, 400], [0, 300], [0, 200],
    [100, 600], [50, 400], [0, 200],
    [800, 2200], [600, 1800], [1000, 2800], [800, 2200],
  ];
  return ranges.map(([lo, hi]) => Math.round(randomBetween(lo, hi, 0)));
}

function makeLandmarks() {
  return Object.entries(STANDING_LANDMARKS).map(([key, [x, y, z]]) => ({
    key,
    x: jitter(x),
    y: jitter(y),
    z: jitter(z, 0.004),
    visibility: randomBetween(0.88, 0.99, 2),
  }));
}

function makeSample(index, abnormal = 0.15) {
  const ts = Date.now() + index * 33;
  const off = () => Math.round(Math.random() * 160 - 80);
  const abnormalBoost = Math.random() < abnormal ? 1.8 : 1;
  const matchStatus = Math.random() > 0.12 ? 'full' : (Math.random() > 0.5 ? 'left_only' : 'right_only');
  const leftPressures = matchStatus === 'right_only' ? [] : genPressures();
  const rightPressures = matchStatus === 'left_only' ? [] : genPressures();

  return {
    interval_id: `iv-${Date.now()}-${index}`,
    user_id: 'u-10001',
    pose_timestamp: ts,
    left_pressure_timestamp: leftPressures.length ? ts + off() : null,
    left_delta_ms: leftPressures.length ? off() : null,
    left_pressures_json: JSON.stringify(leftPressures),
    left_data_type: leftPressures.length ? 1 : null,
    right_pressure_timestamp: rightPressures.length ? ts + off() : null,
    right_delta_ms: rightPressures.length ? off() : null,
    right_pressures_json: JSON.stringify(rightPressures),
    right_data_type: rightPressures.length ? 1 : null,
    match_status: matchStatus,
    fps: 30,
    body_detected: 1,
    tracking_ready: 1,
    camera_active: 1,
    facing_mode: 'user',
    workbench_phase: 'tracking',
    delegate: 'pose-workbench-v2',
    head_tilt_deg: randomBetween(1.2, 5.4 * abnormalBoost, 2),
    shoulder_tilt_deg: randomBetween(0.3, 2.3 * abnormalBoost, 2),
    pelvis_tilt_deg: randomBetween(0.4, 3.4 * abnormalBoost, 2),
    trunk_shift_percent: randomBetween(0.8, 5.8 * abnormalBoost, 2),
    total_height: randomBetween(0.72, 0.9, 4),
    shoulder_width: randomBetween(0.2, 0.34, 4),
    hip_width: randomBetween(0.13, 0.25, 4),
    torso_length: randomBetween(0.28, 0.42, 4),
    leg_length: randomBetween(0.34, 0.52, 4),
    arm_length: randomBetween(0.18, 0.4, 4),
    head_width: randomBetween(0.1, 0.16, 4),
    head_center_x: randomBetween(0.48, 0.52, 4),
    shoulder_center_x: randomBetween(0.48, 0.52, 4),
    shoulder_span: randomBetween(0.2, 0.35, 4),
    landmarks_json: JSON.stringify(makeLandmarks()),
  };
}

function drawCanvas(canvas, sample, xKey, mirror = false) {
  if (!canvas || !sample) return;
  const landmarks = JSON.parse(sample.landmarks_json);
  const lm = Object.fromEntries(landmarks.map((item) => [item.key, item]));
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = '#1a1e2c';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i += 1) {
    ctx.beginPath();
    ctx.moveTo((w * i) / 10, 0);
    ctx.lineTo((w * i) / 10, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, (h * i) / 10);
    ctx.lineTo(w, (h * i) / 10);
    ctx.stroke();
  }

  const pad = 30;
  const toY = (value) => pad + value * (h - pad * 2);
  let toX;
  if (xKey === 'x') {
    toX = (value) => mirror ? (w - pad - value * (w - pad * 2)) : (pad + value * (w - pad * 2));
  } else {
    const zs = Object.values(lm).map((item) => item.z);
    const zMid = (Math.min(...zs) + Math.max(...zs)) / 2;
    toX = (value) => mirror ? (w / 2 - (value - zMid) * (w - pad * 2)) : (w / 2 + (value - zMid) * (w - pad * 2));
  }

  ctx.strokeStyle = 'rgba(108,140,255,0.5)';
  ctx.lineWidth = 2;
  BONES.forEach(([a, b]) => {
    if (!lm[a] || !lm[b]) return;
    ctx.beginPath();
    ctx.moveTo(toX(lm[a][xKey]), toY(lm[a].y));
    ctx.lineTo(toX(lm[b][xKey]), toY(lm[b].y));
    ctx.stroke();
  });

  Object.keys(lm).forEach((key) => {
    const point = lm[key];
    const x = toX(point[xKey]);
    const y = toY(point.y);
    const vis = point.visibility || 0;
    ctx.beginPath();
    ctx.arc(x, y, 3 + vis * 3, 0, Math.PI * 2);
    ctx.fillStyle = vis > 0.9 ? '#22d3ee' : vis > 0.7 ? '#fb923c' : '#f87171';
    ctx.fill();
  });

  ctx.fillStyle = '#6b7084';
  ctx.font = '10px sans-serif';
  ctx.fillText(xKey === 'x' ? '← X →' : '← Z →', w / 2 - 20, h - 6);
  ctx.save();
  ctx.translate(10, h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Y ↓', -10, 0);
  ctx.restore();
}

function JsonView({ sample }) {
  const json = JSON.stringify(sample, null, 2);
  return (
    <pre className="json-box">
      {json}
    </pre>
  );
}

export default function MockWorkbench({ onPipelineReady }) {
  const [samples, setSamples] = useState(() => Array.from({ length: randomSampleCount() }, (_, i) => makeSample(i)));
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('skeleton');
  const [autoTimer, setAutoTimer] = useState(null);
  const [command, setCommand] = useState('请根据当前融合样本，自动生成足底压力与三维姿态的 ETL 流水线。');
  const [submittedCommand, setSubmittedCommand] = useState('');
  const [typed, setTyped] = useState('');
  const [aiState, setAiState] = useState('idle');
  const frontRef = useRef(null);
  const rightRef = useRef(null);
  const chatThreadRef = useRef(null);
  const aiTimerRef = useRef(null);
  const activeSample = samples[activeIdx] || samples[0];

  const matchMeta = useMemo(() => {
    return {
      full: ['status-ok', '完整'],
      left_only: ['status-warn', '仅左'],
      right_only: ['status-warn', '仅右'],
      missed: ['status-err', '未匹配'],
    }[activeSample?.match_status] || ['status-ok', '完整'];
  }, [activeSample]);

  const metricRows = useMemo(() => {
    return METRICS_DEF.map((metric) => buildMetricRow(metric, activeSample));
  }, [activeSample]);

  const metricSummary = useMemo(() => {
    const abnormal = metricRows.filter((metric) => !metric.inRange).length;
    const angleRows = metricRows.filter((metric) => metric.group === '姿态角度');
    const scaleRows = metricRows.filter((metric) => metric.group === '身体尺度');
    const alignRows = metricRows.filter((metric) => metric.group === '中心对齐');
    const visibility = JSON.parse(activeSample.landmarks_json || '[]');
    const avgVisibility = visibility.length
      ? visibility.reduce((sum, point) => sum + (point.visibility || 0), 0) / visibility.length
      : 0;

    return {
      state: abnormal === 0 ? '稳定' : abnormal <= 2 ? '轻微偏移' : '需复核',
      abnormal,
      angleOk: angleRows.filter((metric) => metric.inRange).length,
      angleTotal: angleRows.length,
      scaleOk: scaleRows.filter((metric) => metric.inRange).length,
      scaleTotal: scaleRows.length,
      alignOk: alignRows.filter((metric) => metric.inRange).length,
      alignTotal: alignRows.length,
      quality: Math.round(clamp(avgVisibility * 100 - abnormal * 1.5, 0, 100)),
    };
  }, [activeSample, metricRows]);

  useEffect(() => {
    if (activeTab !== 'skeleton' || !activeSample) return;
    const drawAll = () => {
      drawCanvas(frontRef.current, activeSample, 'x', false);
      drawCanvas(rightRef.current, activeSample, 'z', false);
    };
    drawAll();
    window.addEventListener('resize', drawAll);
    return () => window.removeEventListener('resize', drawAll);
  }, [activeSample, activeTab]);

  useEffect(() => () => {
    if (autoTimer) window.clearInterval(autoTimer);
    if (aiTimerRef.current) window.clearInterval(aiTimerRef.current);
  }, [autoTimer]);

  useEffect(() => {
    if (!chatThreadRef.current) return;
    chatThreadRef.current.scrollTop = chatThreadRef.current.scrollHeight;
  }, [typed, submittedCommand, aiState]);

  function fetchSamples(nextCount = randomSampleCount()) {
    setSamples(Array.from({ length: nextCount }, (_, i) => makeSample(i)));
    setActiveIdx(0);
  }

  function fetchInterval() {
    fetchSamples(10);
  }

  function toggleAuto() {
    if (autoTimer) {
      window.clearInterval(autoTimer);
      setAutoTimer(null);
      return;
    }
    fetchSamples();
    setAutoTimer(window.setInterval(() => fetchSamples(), 3000));
  }

  function startAi() {
    const nextCommand = command.trim();
    if (!nextCommand || aiState === 'streaming') return;
    setSubmittedCommand(nextCommand);
    setAiState('streaming');
    setTyped('');
    let index = 0;
    if (aiTimerRef.current) window.clearInterval(aiTimerRef.current);
    aiTimerRef.current = window.setInterval(() => {
      index += 3;
      setTyped(AI_RESPONSE.slice(0, index));
      if (index >= AI_RESPONSE.length) {
        window.clearInterval(aiTimerRef.current);
        aiTimerRef.current = null;
        setAiState('done');
        window.setTimeout(() => onPipelineReady?.(), 850);
      }
    }, 28);
  }

  function tabClass(name) {
    return `tab${activeTab === name ? ' active' : ''}`;
  }

  return (
    <main className="mock-page">
      <div className="header">
        <h1>数据调试中心</h1>
        <div className="controls">
          <button className="btn btn-primary" type="button" onClick={() => fetchSamples()}>抽取数据</button>
          <button className="btn btn-secondary" type="button" onClick={fetchInterval}>完整会话</button>
          <button className="btn btn-secondary" type="button" onClick={toggleAuto}>{autoTimer ? '停止刷新' : '自动刷新'}</button>
        </div>
      </div>

      <div className="main">
        <div className="sidebar">
          {samples.map((sample, index) => {
            const matchText = { full: '完整', left_only: '仅左', right_only: '仅右', missed: '未匹配' }[sample.match_status];
            return (
              <button
                className={`sample-card ${index === activeIdx ? 'active' : ''}`}
                key={sample.interval_id}
                type="button"
                onClick={() => setActiveIdx(index)}
              >
                <div style={{ fontWeight: 600 }}>样本 #{index}</div>
                <div className="row"><span className="label">匹配</span><span className={`match match-${sample.match_status}`}>{matchText}</span></div>
                <div className="row"><span className="label">头前倾</span><span>{sample.head_tilt_deg}°</span></div>
                <div className="row"><span className="label">FPS</span><span>{sample.fps}</span></div>
              </button>
            );
          })}
        </div>

        <div className="content">
          <div className="info-bar">
            <div className="info-chip"><span className="k">样本</span><span className="v">#{activeIdx}</span></div>
            <div className="info-chip"><span className={`status-dot ${matchMeta[0]}`} /><span className="v">{matchMeta[1]}</span></div>
            <div className="info-chip"><span className="k">FPS</span><span className="v">{activeSample.fps}</span></div>
            <div className="info-chip"><span className="k">Phase</span><span className="v">{activeSample.workbench_phase}</span></div>
            <div className="info-chip"><span className="k">Δ左</span><span className="v">{activeSample.left_delta_ms ?? '-'}ms</span></div>
            <div className="info-chip"><span className="k">Δ右</span><span className="v">{activeSample.right_delta_ms ?? '-'}ms</span></div>
            <div className="info-chip"><span className="k">头前倾</span><span className="v">{activeSample.head_tilt_deg}°</span></div>
            <div className="info-chip"><span className="k">肩倾斜</span><span className="v">{activeSample.shoulder_tilt_deg}°</span></div>
          </div>

          <div className="tabs">
            <button className={tabClass('skeleton')} type="button" onClick={() => setActiveTab('skeleton')}>骨架</button>
            <button className={tabClass('metrics')} type="button" onClick={() => setActiveTab('metrics')}>体态指标</button>
            <button className={tabClass('pressure')} type="button" onClick={() => setActiveTab('pressure')}>足底压力</button>
            <button className={tabClass('raw')} type="button" onClick={() => setActiveTab('raw')}>原始JSON</button>
          </div>

          <div className={`panel${activeTab === 'skeleton' ? ' active' : ''}`}>
            <div className="canvas-wrap">
              <div className="canvas-box"><h3>正面视图 (XY)</h3><canvas ref={frontRef} /></div>
              <div className="canvas-box"><h3>右侧面 (ZY)</h3><canvas ref={rightRef} /></div>
              <div className="canvas-box ai-canvas-box">
                <h3>AI 编排</h3>
                <div className="ai-panel">
                  <div className="ai-chat-top">
                    <div className="ai-avatar">AI</div>
                    <div>
                      <div className="ai-name">deepseek v4</div>
                      <div className="ai-presence"><span />实时编排在线</div>
                    </div>
                  </div>
                  <div className="ai-chat-thread" ref={chatThreadRef}>
                    <div className="chat-message assistant">
                      <div className="chat-bubble">当前融合样本已接入，足底压力流与三维姿态流保持同步监听。</div>
                    </div>
                    {submittedCommand && (
                      <div className="chat-message user">
                        <div className="chat-bubble">{submittedCommand}</div>
                      </div>
                    )}
                    {(typed || aiState === 'streaming' || aiState === 'done') && (
                      <div className="chat-message assistant">
                        <div className="chat-bubble ai-reply">
                          {typed}
                          {aiState === 'streaming' && <span className="caret" />}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ai-composer">
                    <textarea
                      value={command}
                      onChange={(event) => setCommand(event.target.value)}
                      disabled={aiState === 'streaming'}
                      placeholder="输入力姿融合 ETL 指令"
                      rows={2}
                    />
                    <button className="btn btn-primary ai-send" type="button" onClick={startAi} disabled={aiState === 'streaming' || !command.trim()}>
                      {aiState === 'streaming' ? '生成中' : '发送'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`panel${activeTab === 'metrics' ? ' active' : ''}`}>
            <div className="metrics-dashboard">
              <div className="metric-summary-row">
                <div className={`metric-summary ${metricSummary.abnormal ? 'warn' : 'ok'}`}>
                  <span className="summary-label">综合状态</span>
                  <strong>{metricSummary.state}</strong>
                  <span className="summary-sub">异常 {metricSummary.abnormal}/{metricRows.length}</span>
                </div>
                <div className="metric-summary">
                  <span className="summary-label">姿态角度</span>
                  <strong>{metricSummary.angleOk}/{metricSummary.angleTotal}</strong>
                  <span className="summary-sub">头颈肩核心角度</span>
                </div>
                <div className="metric-summary">
                  <span className="summary-label">身体尺度</span>
                  <strong>{metricSummary.scaleOk}/{metricSummary.scaleTotal}</strong>
                  <span className="summary-sub">骨架比例参数</span>
                </div>
                <div className="metric-summary">
                  <span className="summary-label">追踪质量</span>
                  <strong>{metricSummary.quality}%</strong>
                  <span className="summary-sub">visibility 综合评分</span>
                </div>
              </div>

              <div className="metric-section-head">
                <span>实时体态指标</span>
                <span>样本 #{activeIdx} · 中心对齐 {metricSummary.alignOk}/{metricSummary.alignTotal}</span>
              </div>

              <div className="metric-grid">
                {metricRows.map((metric) => (
                  <div className={`metric-item ${metric.inRange ? 'ok' : 'warn'}`} key={metric.key}>
                    <div className="metric-head">
                      <div>
                        <span className="metric-group">{metric.group}</span>
                        <span className="metric-name">{metric.name}</span>
                      </div>
                      <span className={`metric-status ${metric.inRange ? 'ok' : 'warn'}`}>{metric.status}</span>
                    </div>
                    <div className="metric-value-row">
                      <span className="metric-val">{metric.formattedValue}</span>
                      <span className="metric-range">正常 {metric.rangeText}</span>
                    </div>
                    <div
                      className="metric-bar"
                      style={{
                        '--normal-left': `${metric.normalLeft}%`,
                        '--normal-width': `${metric.normalWidth}%`,
                        '--marker-left': `${metric.markerLeft}%`,
                      }}
                    >
                      <div className="normal" />
                      <div className="marker" />
                    </div>
                    <div className="metric-sub">
                      <span>0</span>
                      <span>{metric.status === '正常' ? '落在参考区间' : `当前${metric.status}`}</span>
                      <span>{metric.formattedValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`panel${activeTab === 'pressure' ? ' active' : ''}`}>
            <div className="pressure-wrap">
              <FootPressure title="左脚 (left)" values={JSON.parse(activeSample.left_pressures_json || '[]')} zones={LEFT_ZONES} status={activeSample.match_status} />
              <FootPressure title="右脚 (right)" values={JSON.parse(activeSample.right_pressures_json || '[]')} zones={RIGHT_ZONES} status={activeSample.match_status} />
            </div>
          </div>

          <div className={`panel${activeTab === 'raw' ? ' active' : ''}`}>
            <JsonView sample={activeSample} />
          </div>

        </div>
      </div>
    </main>
  );
}

function FootPressure({ title, values, zones, status }) {
  if (!values.length) {
    return (
      <div className="foot-col">
        <h4>{title}</h4>
        <div style={{ color: 'var(--muted)', padding: 20 }}>无数据 ({status})</div>
      </div>
    );
  }

  const rows = chunkFootZones(zones);

  return (
    <div className="foot-col">
      <h4>{title}</h4>
      <div className="pressure-grid">
        {rows.map((row, rowIndex) => (
          <div className="pressure-row" key={`${title}-${rowIndex}`}>
            {row.map((zone) => {
              const index = zones.indexOf(zone);
              const value = values[index] || 0;
              const intensity = Math.min(value / 3000, 1);
              const r = Math.round(30 + intensity * 225);
              const g = Math.round(60 * (1 - intensity));
              const b = Math.round(80 * (1 - intensity));
              return (
                <div className="pressure-cell" key={zone}>
                  <div className="pz" style={{ background: `rgba(${r},${g},${b},0.4)`, borderColor: `rgba(${r},${g},${b},0.6)`, color: `rgb(${r},${g + 100},${b + 100})` }}>
                    {value}
                  </div>
                  <div className="pz-label">{ZONE_LABELS[zone] || zone.slice(0, 6)}</div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
