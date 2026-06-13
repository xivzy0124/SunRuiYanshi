import { useState, useRef, useEffect } from 'react';
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ─── 全字段节点（MockWorkbench 真实字段 + 处理/输出节点） ───
const FIELDS = [
  // 标识
  { id: 'interval_id', name: 'interval_id', cn: '采样区间ID', type: 'string', cat: '标识', v: '--muted', desc: '每个采集区间的唯一标识，作为融合数据集的主键。' },
  { id: 'user_id', name: 'user_id', cn: '用户ID', type: 'string', cat: '标识', v: '--muted', desc: '受测用户标识，用于多用户数据隔离，本身不参与融合计算。' },
  // 时间戳
  { id: 'pose_timestamp', name: 'pose_timestamp', cn: '姿态时间戳', type: 'int64', cat: '时间戳', v: '--cyan', desc: '人体姿态帧的毫秒级时间戳，双流时序对齐的基准。' },
  { id: 'left_pressure_timestamp', name: 'left_pressure_timestamp', cn: '左脚压力时间戳', type: 'int64', cat: '时间戳', v: '--accent', desc: '左脚足底压力帧时间戳，用于与姿态帧做毫秒级时序对齐。' },
  { id: 'right_pressure_timestamp', name: 'right_pressure_timestamp', cn: '右脚压力时间戳', type: 'int64', cat: '时间戳', v: '--accent', desc: '右脚足底压力帧时间戳，用于与姿态帧做毫秒级时序对齐。' },
  // 时间差
  { id: 'left_delta_ms', name: 'left_delta_ms', cn: '左脚时间差', type: 'int', cat: '时间差', v: '--accent', desc: '左脚压力与姿态帧的时间偏差(ms)，决定匹配质量。' },
  { id: 'right_delta_ms', name: 'right_delta_ms', cn: '右脚时间差', type: 'int', cat: '时间差', v: '--accent', desc: '右脚压力与姿态帧的时间偏差(ms)，决定匹配质量。' },
  // 压力数据
  { id: 'left_pressures_json', name: 'left_pressures_json', cn: '左脚压力阵列', type: 'json', cat: '压力数据', v: '--accent', desc: '左脚足底压力传感器阵列原始读数(JSON)，清洗标准化后进入融合压力数据。' },
  { id: 'right_pressures_json', name: 'right_pressures_json', cn: '右脚压力阵列', type: 'json', cat: '压力数据', v: '--accent', desc: '右脚足底压力传感器阵列原始读数(JSON)，清洗标准化后进入融合压力数据。' },
  // 匹配状态（由时间差判定）
  { id: 'match_status', name: 'match_status', cn: '匹配状态', type: 'enum', cat: '匹配状态', v: '--green', desc: '左右脚压力与姿态的时序匹配结果，是融合质量的关键标记。' },
  // 帧率/检测
  { id: 'fps', name: 'fps', cn: '帧率', type: 'int', cat: '帧率/检测', v: '--orange', desc: '姿态采集帧率(30fps)，质量监控字段，不直接参与融合。' },
  { id: 'body_detected', name: 'body_detected', cn: '人体检测', type: 'bool', cat: '帧率/检测', v: '--orange', desc: '当前帧是否检测到人体，质量门控标记。' },
  { id: 'tracking_ready', name: 'tracking_ready', cn: '追踪就绪', type: 'bool', cat: '帧率/检测', v: '--orange', desc: '姿态追踪是否稳定就绪，质量门控标记。' },
  // 体态角度（由关键点派生）
  { id: 'head_tilt_deg', name: 'head_tilt_deg', cn: '头前倾角', type: 'float', cat: '体态角度', v: '--cyan', desc: '由关键点计算的头部前倾角度，核心体态评估指标。' },
  { id: 'shoulder_tilt_deg', name: 'shoulder_tilt_deg', cn: '颈侧倾角', type: 'float', cat: '体态角度', v: '--cyan', desc: '由关键点计算的颈部侧倾角度。' },
  { id: 'pelvis_tilt_deg', name: 'pelvis_tilt_deg', cn: '颈旋转角', type: 'float', cat: '体态角度', v: '--cyan', desc: '由关键点计算的颈部旋转角度。' },
  { id: 'trunk_shift_percent', name: 'trunk_shift_percent', cn: '肩倾斜角', type: 'float', cat: '体态角度', v: '--cyan', desc: '由关键点计算的肩部倾斜程度。' },
  // 身体尺寸（由关键点派生）
  { id: 'total_height', name: 'total_height', cn: '总身高', type: 'float', cat: '身体尺寸', v: '--cyan', desc: '由关键点估算的归一化总身高。' },
  { id: 'shoulder_width', name: 'shoulder_width', cn: '肩宽', type: 'float', cat: '身体尺寸', v: '--cyan', desc: '由关键点估算的肩部宽度。' },
  { id: 'hip_width', name: 'hip_width', cn: '髋宽', type: 'float', cat: '身体尺寸', v: '--cyan', desc: '由关键点估算的髋部宽度。' },
  { id: 'torso_length', name: 'torso_length', cn: '躯干长', type: 'float', cat: '身体尺寸', v: '--cyan', desc: '由关键点估算的躯干长度。' },
  { id: 'leg_length', name: 'leg_length', cn: '腿长', type: 'float', cat: '身体尺寸', v: '--cyan', desc: '由关键点估算的腿部长度。' },
  { id: 'arm_length', name: 'arm_length', cn: '臂长', type: 'float', cat: '身体尺寸', v: '--cyan', desc: '由关键点估算的手臂长度。' },
  { id: 'head_width', name: 'head_width', cn: '头宽', type: 'float', cat: '身体尺寸', v: '--cyan', desc: '由关键点估算的头部宽度。' },
  // 中心位置（由关键点派生）
  { id: 'head_center_x', name: 'head_center_x', cn: '头部中心X', type: 'float', cat: '中心位置', v: '--cyan', desc: '由关键点计算的头部水平中心位置。' },
  { id: 'shoulder_center_x', name: 'shoulder_center_x', cn: '肩中心X', type: 'float', cat: '中心位置', v: '--cyan', desc: '由关键点计算的肩部水平中心位置。' },
  { id: 'shoulder_span', name: 'shoulder_span', cn: '肩跨度', type: 'float', cat: '中心位置', v: '--cyan', desc: '由关键点计算的肩部水平跨度。' },
];

// ─── 姿态关键点（pose 模型直接输出的归一化骨骼点，是体态指标的真实上游） ───
const KP_DEF = [
  ['nose', '鼻尖'], ['left_eye', '左眼'], ['right_eye', '右眼'], ['left_ear', '左耳'], ['right_ear', '右耳'],
  ['left_shoulder', '左肩'], ['right_shoulder', '右肩'], ['left_elbow', '左肘'], ['right_elbow', '右肘'],
  ['left_wrist', '左腕'], ['right_wrist', '右腕'], ['left_hip', '左髋'], ['right_hip', '右髋'],
  ['left_knee', '左膝'], ['right_knee', '右膝'], ['left_ankle', '左踝'], ['right_ankle', '右踝'],
];
const KEYPOINTS = KP_DEF.map(([k, cn]) => ({
  id: `kp:${k}`, name: `kp_${k}`, cn: `${cn}关键点`, type: 'point', cat: '关键点', v: '--purple',
  desc: `姿态模型逐帧输出的「${cn}」归一化坐标 (x, y, 可见度)，是体态角度与身体尺寸指标的原始上游，并清洗后汇入融合姿态数据。`,
}));

// ─── 足底压力派生指标（由左右脚压力阵列算出，是步态/平衡分析的真实中间字段） ───
const PRESSURE_METRICS = [
  { id: 'left_cop_x', name: 'left_cop_x', cn: '左脚压心X', type: 'float', cat: '足压指标', v: '--accent', desc: '由左脚压力阵列计算的足底压力中心(COP)横向坐标，反映左脚重心偏移。' },
  { id: 'left_cop_y', name: 'left_cop_y', cn: '左脚压心Y', type: 'float', cat: '足压指标', v: '--accent', desc: '由左脚压力阵列计算的足底压力中心(COP)纵向坐标，反映前后重心分布。' },
  { id: 'right_cop_x', name: 'right_cop_x', cn: '右脚压心X', type: 'float', cat: '足压指标', v: '--accent', desc: '由右脚压力阵列计算的足底压力中心(COP)横向坐标。' },
  { id: 'right_cop_y', name: 'right_cop_y', cn: '右脚压心Y', type: 'float', cat: '足压指标', v: '--accent', desc: '由右脚压力阵列计算的足底压力中心(COP)纵向坐标。' },
  { id: 'left_force_total', name: 'left_force_total', cn: '左脚总压力', type: 'float', cat: '足压指标', v: '--accent', desc: '左脚压力阵列各点求和得到的总受力，用于左右承重对比。' },
  { id: 'right_force_total', name: 'right_force_total', cn: '右脚总压力', type: 'float', cat: '足压指标', v: '--accent', desc: '右脚压力阵列各点求和得到的总受力。' },
  { id: 'left_contact_area', name: 'left_contact_area', cn: '左脚接触面积', type: 'float', cat: '足压指标', v: '--accent', desc: '左脚压力阵列中超过阈值的传感点占比，估算足底接触面积。' },
  { id: 'right_contact_area', name: 'right_contact_area', cn: '右脚接触面积', type: 'float', cat: '足压指标', v: '--accent', desc: '右脚压力阵列中超过阈值的传感点占比。' },
  { id: 'pressure_balance', name: 'pressure_balance', cn: '左右压力均衡度', type: 'float', cat: '足压指标', v: '--accent', desc: '由左右脚总压力计算的承重均衡比例，是平衡评估的关键中间量。' },
  { id: 'arch_index', name: 'arch_index', cn: '足弓指数', type: 'float', cat: '足压指标', v: '--accent', desc: '由左右脚接触面积比推算的足弓形态指数(高弓/扁平)。' },
];

// ─── 足压速率/比率（由压力阵列与足压指标进一步计算的步态/负荷比率，链路更深） ───
const PRESSURE_RATES = [
  { id: 'forefoot_load_ratio', name: 'forefoot_load_ratio', cn: '前足负荷率', type: 'float', cat: '足压速率', v: '--pink', desc: '前掌区域压力占全足总压力的比率，反映前后重心分配。' },
  { id: 'rearfoot_load_ratio', name: 'rearfoot_load_ratio', cn: '后足负荷率', type: 'float', cat: '足压速率', v: '--pink', desc: '足跟区域压力占全足总压力的比率，与站姿后倾相关。' },
  { id: 'midfoot_load_ratio', name: 'midfoot_load_ratio', cn: '中足负荷率', type: 'float', cat: '足压速率', v: '--pink', desc: '足弓区域压力占比，过高常提示扁平足倾向。' },
  { id: 'medial_lateral_ratio', name: 'medial_lateral_ratio', cn: '内外侧压力比', type: 'float', cat: '足压速率', v: '--pink', desc: '足内侧与外侧压力之比，反映足内/外翻程度。' },
  { id: 'peak_pressure_ratio', name: 'peak_pressure_ratio', cn: '峰值压力比', type: 'float', cat: '足压速率', v: '--pink', desc: '局部峰值压力与平均压力之比，定位异常受力点。' },
  { id: 'loading_rate', name: 'loading_rate', cn: '足底加载率', type: 'float', cat: '足压速率', v: '--pink', desc: '由左右总压力随时间变化估算的加载速率(N/s)，越高冲击越大。' },
  { id: 'cop_velocity', name: 'cop_velocity', cn: '压心移动速率', type: 'float', cat: '足压速率', v: '--pink', desc: '由双脚压心坐标帧间位移算出的压力中心移动速率，平衡控制核心量。' },
  { id: 'sway_rate', name: 'sway_rate', cn: '压心摆动率', type: 'float', cat: '足压速率', v: '--pink', desc: '由压心移动速率聚合的身体摇摆频率，站立稳定性指标。' },
  { id: 'single_support_ratio', name: 'single_support_ratio', cn: '单脚支撑率', type: 'float', cat: '足压速率', v: '--pink', desc: '单脚接触地面时间占比，由左右接触面积交替推算。' },
];

// ─── 综合评分（由多项体态/压力指标聚合，处于血缘最末端，链路最深） ───
const SCORES = [
  { id: 'posture_score', name: 'posture_score', cn: '体态综合评分', type: 'float', cat: '综合评分', v: '--green', desc: '由头/颈/盆/躯干多项角度加权聚合的体态健康总评分。' },
  { id: 'balance_score', name: 'balance_score', cn: '平衡综合评分', type: 'float', cat: '综合评分', v: '--green', desc: '由左右压力均衡度、压心偏移与摆动率聚合的站立平衡评分。' },
  { id: 'symmetry_index', name: 'symmetry_index', cn: '左右对称指数', type: 'float', cat: '综合评分', v: '--green', desc: '由肩宽/髋宽与左右压力均衡度聚合的身体左右对称性指数。' },
  { id: 'gait_stability_score', name: 'gait_stability_score', cn: '步态稳定评分', type: 'float', cat: '综合评分', v: '--green', desc: '由压心摆动率、加载率与左右负荷比聚合的步态稳定性总评分。' },
];

const PROC = [
  { id: 'proc:ts', name: 'ts', cn: '统一时间戳', type: 'int64', cat: '融合', v: '--green', desc: '毫秒级对齐后的统一时间戳，双流融合主键。' },
  { id: 'proc:pressure_data', name: 'pressure_data', cn: '融合压力数据', type: 'float[]', cat: '融合', v: '--green', desc: '左右脚压力清洗标准化后的融合压力数据。' },
  { id: 'proc:pose_data', name: 'pose_data', cn: '融合姿态数据', type: 'object', cat: '融合', v: '--green', desc: '关键点清洗标准化后的融合姿态数据。' },
  { id: 'out:db', name: 't_fusion_health_dataset', cn: '体态健康数据集', type: 'table', cat: '输出', v: '--orange', desc: '融合后的标准化持久化数据集，沉淀为专属体态健康数据。' },
  { id: 'out:api', name: '/api/v1/latest', cn: 'API 接口', type: 'endpoint', cat: '输出', v: '--orange', desc: '对外发布的标准化数据接口，供后续模块实时调用。' },
];

const NODES = [...FIELDS, ...KEYPOINTS, ...PRESSURE_METRICS, ...PRESSURE_RATES, ...SCORES, ...PROC];
const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

const DERIVED = [
  'head_tilt_deg', 'shoulder_tilt_deg', 'pelvis_tilt_deg', 'trunk_shift_percent',
  'total_height', 'shoulder_width', 'hip_width', 'torso_length', 'leg_length', 'arm_length', 'head_width',
  'head_center_x', 'shoulder_center_x', 'shoulder_span',
];

// 体态指标 ← 真实的关键点来源（与人体测量学一致）
const DERIVE_SRC = {
  head_tilt_deg: ['nose', 'left_ear', 'right_ear'],
  shoulder_tilt_deg: ['left_shoulder', 'right_shoulder'],
  pelvis_tilt_deg: ['left_hip', 'right_hip'],
  trunk_shift_percent: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
  total_height: ['nose', 'left_ankle', 'right_ankle'],
  shoulder_width: ['left_shoulder', 'right_shoulder'],
  hip_width: ['left_hip', 'right_hip'],
  torso_length: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
  leg_length: ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle'],
  arm_length: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'],
  head_width: ['left_ear', 'right_ear'],
  head_center_x: ['nose', 'left_eye', 'right_eye'],
  shoulder_center_x: ['left_shoulder', 'right_shoulder'],
  shoulder_span: ['left_shoulder', 'right_shoulder'],
};
const DERIVE_EDGES = Object.entries(DERIVE_SRC).flatMap(([field, srcs]) =>
  srcs.map((s) => ({ from: `kp:${s}`, to: field, type: 'derive' }))
);
// 全部关键点清洗后汇入融合姿态数据
const POSEFUSE_EDGES = KP_DEF.map(([k]) => ({ from: `kp:${k}`, to: 'proc:pose_data', type: 'posefuse' }));

// 足压指标 ← 压力阵列；均衡度/足弓再由前序指标聚合（形成多级链路）
const PRESSURE_DERIVE = {
  left_cop_x: ['left_pressures_json'], left_cop_y: ['left_pressures_json'],
  left_force_total: ['left_pressures_json'], left_contact_area: ['left_pressures_json'],
  right_cop_x: ['right_pressures_json'], right_cop_y: ['right_pressures_json'],
  right_force_total: ['right_pressures_json'], right_contact_area: ['right_pressures_json'],
  pressure_balance: ['left_force_total', 'right_force_total'],
  arch_index: ['left_contact_area', 'right_contact_area'],
};
// 足压速率/比率 ← 压力阵列 / 已有足压指标（部分二次聚合，链路更深）
const RATE_DERIVE = {
  forefoot_load_ratio: ['left_pressures_json', 'right_pressures_json'],
  rearfoot_load_ratio: ['left_pressures_json', 'right_pressures_json'],
  midfoot_load_ratio: ['left_pressures_json', 'right_pressures_json'],
  medial_lateral_ratio: ['left_pressures_json', 'right_pressures_json'],
  peak_pressure_ratio: ['left_pressures_json', 'right_pressures_json'],
  loading_rate: ['left_force_total', 'right_force_total'],
  cop_velocity: ['left_cop_x', 'left_cop_y', 'right_cop_x', 'right_cop_y'],
  sway_rate: ['cop_velocity'],
  single_support_ratio: ['left_contact_area', 'right_contact_area'],
};
// 综合评分 ← 多项体态/压力/速率指标聚合
const SCORE_DERIVE = {
  posture_score: ['head_tilt_deg', 'shoulder_tilt_deg', 'pelvis_tilt_deg', 'trunk_shift_percent'],
  balance_score: ['pressure_balance', 'left_cop_x', 'right_cop_x', 'sway_rate'],
  symmetry_index: ['shoulder_width', 'hip_width', 'pressure_balance', 'medial_lateral_ratio'],
  gait_stability_score: ['sway_rate', 'loading_rate', 'pressure_balance', 'single_support_ratio'],
};
const METRIC_DERIVE_EDGES = [...Object.entries(PRESSURE_DERIVE), ...Object.entries(RATE_DERIVE), ...Object.entries(SCORE_DERIVE)]
  .flatMap(([f, srcs]) => srcs.map((s) => ({ from: s, to: f, type: 'derive' })));
// 新增指标携带入库
const METRIC_CARRY_EDGES = [...Object.keys(PRESSURE_DERIVE), ...Object.keys(RATE_DERIVE), ...Object.keys(SCORE_DERIVE)]
  .map((d) => ({ from: d, to: 'out:db', type: 'carry' }));

const EDGES = [
  ...DERIVE_EDGES,
  ...POSEFUSE_EDGES,
  ...METRIC_DERIVE_EDGES,
  ...METRIC_CARRY_EDGES,
  { from: 'left_pressures_json', to: 'proc:pressure_data', type: 'clean' },
  { from: 'right_pressures_json', to: 'proc:pressure_data', type: 'clean' },
  { from: 'pose_timestamp', to: 'proc:ts', type: 'timealign' },
  { from: 'left_pressure_timestamp', to: 'proc:ts', type: 'timealign' },
  { from: 'right_pressure_timestamp', to: 'proc:ts', type: 'timealign' },
  { from: 'left_delta_ms', to: 'match_status', type: 'match' },
  { from: 'right_delta_ms', to: 'match_status', type: 'match' },
  { from: 'proc:ts', to: 'out:db', type: 'converge' },
  { from: 'proc:pressure_data', to: 'out:db', type: 'converge' },
  { from: 'proc:pose_data', to: 'out:db', type: 'converge' },
  { from: 'match_status', to: 'out:db', type: 'converge' },
  { from: 'interval_id', to: 'out:db', type: 'converge' },
  ...DERIVED.map((d) => ({ from: d, to: 'out:db', type: 'carry' })),
  { from: 'out:db', to: 'out:api', type: 'publish' },
];

const REL_WORD = {
  clean: '清洗标准化', derive: '派生计算', timealign: '时序对齐', match: '匹配判定',
  converge: '汇入融合', carry: '携带入库', publish: '对外发布', posefuse: '姿态融合',
};
const REL_COLORVAR = { match: '--green', converge: '--green', publish: '--orange' };
function edgeColorVar(edge) { return REL_COLORVAR[edge.type] || NODE_BY_ID[edge.from].v; }

const CAT_LABELS = {
  标识: '标识', 时间戳: '时间戳', 时间差: '时间差', 压力数据: '压力数据', 匹配状态: '匹配状态',
  '帧率/检测': '帧率/检测', 体态角度: '体态角度', 身体尺寸: '身体尺寸', 中心位置: '中心位置',
  关键点: '关键点', 足压指标: '足压指标', 足压速率: '足压速率', 综合评分: '综合评分', 融合: '融合处理', 输出: '输出',
};

// ─── 同心球壳：外层=源字段 / 中层=派生·融合 / 内核=输出 ───
const SHELL_R = [168, 96, 24];
function shellOf(node) {
  if (node.id.startsWith('out:')) return 2;
  if (['体态角度', '身体尺寸', '中心位置', '足压指标', '足压速率', '综合评分', '融合', '匹配状态'].includes(node.cat)) return 1;
  return 0;
}

function computeLayout() {
  const byShell = [[], [], []];
  NODES.forEach((n) => byShell[shellOf(n)].push(n));
  const pos = {};
  byShell.forEach((arr, s) => {
    const n = arr.length;
    arr.forEach((node, i) => {
      const y = n === 1 ? 0 : 1 - (2 * (i + 0.5)) / n;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = Math.PI * (1 + Math.sqrt(5)) * i + s * 1.2; // 各层错开角度，减少径向重叠
      pos[node.id] = new THREE.Vector3(
        SHELL_R[s] * r * Math.cos(theta),
        SHELL_R[s] * y,
        SHELL_R[s] * r * Math.sin(theta)
      );
    });
  });
  return pos;
}

// 沿血缘方向做 BFS 分层：dir='up' 取上游(edge.to===cur→from)，'down' 取下游
function bfsLevels(selId, dir) {
  const level = {};
  const visited = new Set([selId]);
  let queue = [[selId, 0]];
  while (queue.length) {
    const [cur, d] = queue.shift();
    for (const e of EDGES) {
      const next = dir === 'up' ? (e.to === cur ? e.from : null) : (e.from === cur ? e.to : null);
      if (next && !visited.has(next)) { visited.add(next); level[next] = d + 1; queue.push([next, d + 1]); }
    }
  }
  return level; // 不含 selId 自身
}

// 选中后的「绽放」布局：本字段固定在中心，上游向上半区、下游向下半区张成饱满的弧形花瓣。
// 非链路节点全部隐藏，相机再自适应取景，所以这里只追求构图美观、半径有界即可。
const SEL_RING_BASE = 86;   // 第一层环半径
const SEL_RING_GAP = 72;    // 每深一层增加的半径
const SEL_MAX_HALF = 1.62;  // 单层最大张角(±约93°)，超过则分内外两环避免拥挤
function computeSelLayout(selId) {
  const upLvl = bfsLevels(selId, 'up');
  const downLvl = bfsLevels(selId, 'down');
  const byLevel = new Map(); // signedLevel(>0上游 / <0下游) → [ids]
  const push = (lvl, id) => { if (!byLevel.has(lvl)) byLevel.set(lvl, []); byLevel.get(lvl).push(id); };
  Object.entries(upLvl).forEach(([id, d]) => push(d, id));
  Object.entries(downLvl).forEach(([id, d]) => push(-d, id));
  const layout = { [selId]: new THREE.Vector3(0, 0, 0) };
  let maxR = SEL_RING_BASE;
  for (const [lvl, ids] of byLevel) {
    const depth = Math.abs(lvl);
    const up = lvl > 0 ? 1 : -1;
    const n = ids.length;
    // 字段多到一层弧排不下时，拆成内外两道弧（前后分排），各自张角不至于过密
    const ringCount = n > 9 ? 2 : 1;
    ids.forEach((id, i) => {
      const ring = i % ringCount;
      const idxInRing = Math.floor(i / ringCount);
      const ringN = Math.ceil((n - ring) / ringCount);
      const R = SEL_RING_BASE + (depth - 1) * SEL_RING_GAP + ring * 42;
      const half = ringN === 1 ? 0 : Math.min((ringN - 1) * 0.40, SEL_MAX_HALF);
      const a = ringN === 1 ? 0 : -half + idxInRing * ((2 * half) / (ringN - 1));
      const x = R * Math.sin(a);
      const y = up * R * Math.cos(a);
      layout[id] = new THREE.Vector3(x, y, (i % 2 ? 1 : -1) * Math.min(depth * 12, 36) - ring * 26);
      maxR = Math.max(maxR, Math.hypot(x, y));
    });
  }
  const chain = new Set([selId, ...Object.keys(upLvl), ...Object.keys(downLvl)]);
  return { chain, layout, maxR };
}

function baseRadius(node) {
  let r;
  if (node.id === 'out:db') r = 11;
  else if (node.id === 'out:api') r = 9;
  else if (node.cat === '融合') r = 7;
  else if (node.cat === '压力数据' || node.cat === '关键点') r = 6.4;
  else r = 5.4;
  return r * 1.25; // 整体放大 25%
}

function makeGlowTexture() {
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export default function LineageGraph() {
  const mountRef = useRef(null);
  const labelsRef = useRef(null);
  const apiRef = useRef(null);
  const selectedRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  // 全屏时锁定页面滚动 + ESC 退出
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e) => { if (e.key === 'Escape') setFullscreen(false); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen]);

  useEffect(() => {
    const container = mountRef.current;
    const labelLayer = labelsRef.current;
    if (!container || !labelLayer) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 520;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, width / height, 1, 4000);
    camera.position.set(0, 12, 500);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = 'grab';

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 240;
    controls.maxDistance = 820;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.42;

    const colorCache = {};
    const col = (v) => {
      if (!colorCache[v]) {
        const hex = getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888888';
        colorCache[v] = new THREE.Color(hex);
      }
      return colorCache[v];
    };

    const glowTex = makeGlowTexture();
    const sphereGeo = new THREE.SphereGeometry(1, 28, 28);
    const layout = computeLayout();

    // 同心壳层导引球已移除：线框球会渲染成密密麻麻的暗色网格线（“很多黑线”），观感差。
    // 分层结构仍由节点的同心半径 + 底部说明体现。后续 shellMeshes 相关循环对空数组自动空转。
    const shellMeshes = [];

    // ── 节点 + DOM 标签 ──
    const nodeObjs = {};
    const pickables = [];
    NODES.forEach((node) => {
      const finalPos = layout[node.id];
      const color = col(node.v);
      const baseR = baseRadius(node);

      const mat = new THREE.MeshBasicMaterial({ color: color.clone(), transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.scale.setScalar(baseR);
      mesh.userData.id = node.id;
      scene.add(mesh);
      pickables.push(mesh);

      const glowMat = new THREE.SpriteMaterial({
        map: glowTex, color: color.clone(), transparent: true, opacity: 0.5,
        depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const glow = new THREE.Sprite(glowMat);
      const glowBase = baseR * 3.4;
      glow.scale.setScalar(glowBase);
      scene.add(glow);

      const labelEl = document.createElement('div');
      labelEl.className = 'l3d-label';
      labelEl.textContent = node.name;
      labelEl.style.setProperty('--lc', `var(${node.v})`);
      labelLayer.appendChild(labelEl);

      nodeObjs[node.id] = {
        mesh, mat, glow, glowMat, glowBase, baseR, finalPos, labelEl,
        // 平滑过渡：current 当前值 → t* 目标值
        curScale: baseR, curGlow: glowBase,
        tOp: 1, tGlow: 0.5, tScale: baseR, tGlowScale: glowBase,
      };
    });

    // ── 关联线：把所有边都连上，统一用细发光管(Additive)。主干亮、派生网弱，分层不糊成暗带 ──
    const partGeo = new THREE.SphereGeometry(1.3, 10, 10);
    const isDense = (e) => e.type === 'derive' || e.type === 'carry' || e.type === 'posefuse';
    const edgeObjs = [];
    const flowParts = [];
    EDGES.forEach((e, i) => {
      const a = nodeObjs[e.from].finalPos;
      const b = nodeObjs[e.to].finalPos;
      const mid = a.clone().add(b).multiplyScalar(0.5).multiplyScalar(0.88); // 轻微内凹，向核心汇聚
      const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
      const cv = edgeColorVar(e);
      const dense = isDense(e);
      const baseOp = dense ? 0.3 : 0.65; // 普通实色连接线：派生网弱、主干清晰（仿最初版本的连线）
      const mat = new THREE.MeshBasicMaterial({
        color: col(cv).clone(), transparent: true, opacity: 0, depthWrite: false,
      });
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 22, dense ? 0.45 : 0.8, 6, false), mat);
      scene.add(tube);
      edgeObjs.push({ mat, mesh: tube, baseOp });

      // 流向光点只挂在主干边上，避免上百个点过于杂乱
      if (!dense) {
        const pMat = new THREE.MeshBasicMaterial({
          color: col(cv).clone(), transparent: true, opacity: 0, depthWrite: false,
        });
        const pMesh = new THREE.Mesh(partGeo, pMat);
        pMesh.scale.setScalar(0.7);
        scene.add(pMesh);
        flowParts.push({ mesh: pMesh, mat: pMat, curve, offset: (i % 7) / 7, cv });
      }
    });

    // ── 动态血缘连线：选中态用「细圆柱实体」连接链路节点（替代 1px GL 细线，避免糊成黑线） ──
    const CHAIN_POOL = 220;
    const chainCylGeo = new THREE.CylinderGeometry(1, 1, 1, 7); // 单位高度沿 +Y，渲染时缩放/旋转复用
    const CYL_UP = new THREE.Vector3(0, 1, 0);
    const chainLines = [];
    const chainParts = [];
    for (let i = 0; i < CHAIN_POOL; i++) {
      // 与首页关联线一致：实色连接线（普通混合，非发光）
      const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const mesh = new THREE.Mesh(chainCylGeo, mat);
      mesh.frustumCulled = false; mesh.visible = false;
      scene.add(mesh);
      chainLines.push({ mesh, mat });

      const cpMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
      const cpMesh = new THREE.Mesh(partGeo, cpMat);
      cpMesh.visible = false;
      scene.add(cpMesh);
      chainParts.push({ mesh: cpMesh, mat: cpMat });
    }
    const sP = new THREE.Vector3();

    // ── 高亮目标：选中/悬停只更新"目标值"，由渲染循环平滑插值过渡 ──
    let currentChain = null;
    let selLayout = null;          // 选中态布局：id → 目标坐标
    let selMaxR = 0;               // 链路最大半径，用于相机自适应取景
    let activeChainEdges = [];     // 选中链路内的边（动态连线用）
    let hoverId = null;
    function updateTargets() {
      const selId = selectedRef.current;
      if (selId) {
        const r = computeSelLayout(selId);
        currentChain = r.chain;
        selLayout = r.layout;
        selMaxR = r.maxR;
        activeChainEdges = EDGES.filter((e) => currentChain.has(e.from) && currentChain.has(e.to));
      } else {
        currentChain = null;
        selLayout = null;
        selMaxR = 0;
        activeChainEdges = [];
      }
      controls.autoRotateSpeed = selId ? 0.22 : 0.42; // 选中时放慢自转
      const ch = currentChain;
      NODES.forEach((node) => {
        const o = nodeObjs[node.id];
        const inChain = !ch || ch.has(node.id);
        const isSel = selId === node.id;
        const isHover = !selId && hoverId === node.id; // 选中态不叠加悬停
        // 选中后非链路节点完全隐藏，只留下当前血缘
        o.tOp = inChain ? 1 : 0;
        o.tGlow = isSel ? 1 : isHover ? 0.85 : ch ? (inChain ? 0.55 : 0) : inChain ? 0.5 : 0.02;
        o.tScale = (isSel ? 1.7 : isHover ? 1.22 : 1) * o.baseR;
        o.tGlowScale = (isSel ? 1.7 : 1) * o.glowBase;
      });
      // 选中态由绽放连线接管，关联线整体淡出
      edgeObjs.forEach((eo) => { eo.tOp = ch ? 0 : eo.baseOp; });
      shellMeshes.forEach((sm) => (sm.tOp = ch ? 0 : 0.05));
    }
    const applySelection = () => updateTargets();
    function setHover(id) {
      if (hoverId === id) return;
      hoverId = id;
      updateTargets();
    }
    shellMeshes.forEach((sm) => (sm.tOp = 0.05));
    edgeObjs.forEach((eo) => (eo.tOp = eo.baseOp));

    // ── 拾取 ──
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickV = new THREE.Vector3();
    let downX = 0, downY = 0;
    function pickAt(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickables, false);
      for (const h of hits) { if (h.object.visible) return h.object.userData.id; }
      // 屏幕就近兜底：射线没命中时，取点击位置 30px 内最靠前的节点
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      let best = null;
      let bestD = 30;
      NODES.forEach((node) => {
        const o = nodeObjs[node.id];
        if (!o.mesh.visible) return; // 隐藏节点不参与就近兜底
        pickV.copy(o.mesh.position).project(camera);
        if (pickV.z > 1) return;
        const sx = (pickV.x * 0.5 + 0.5) * rect.width;
        const sy = (-pickV.y * 0.5 + 0.5) * rect.height;
        const d = Math.hypot(sx - px, sy - py);
        if (d < bestD) { bestD = d; best = node.id; }
      });
      return best;
    }
    function onPointerMove(ev) {
      const id = pickAt(ev.clientX, ev.clientY);
      renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
      setHover(id);
    }
    function onPointerDown(ev) { downX = ev.clientX; downY = ev.clientY; }
    function onPointerUp(ev) {
      if (Math.hypot(ev.clientX - downX, ev.clientY - downY) > 5) return;
      const id = pickAt(ev.clientX, ev.clientY);
      setSelected((prev) => {
        if (!id) return prev; // 点到空白不取消选中（避免误触弹回主视图），用 × 关闭
        return prev === id ? null : id; // 点同一个取消，点别的切换
      });
    }
    const dom = renderer.domElement;
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointerup', onPointerUp);

    // ── 主题刷新 ──
    function refreshColors() {
      Object.keys(colorCache).forEach((k) => delete colorCache[k]);
      NODES.forEach((node) => {
        const o = nodeObjs[node.id];
        const c = col(node.v);
        o.mat.color.copy(c);
        o.glowMat.color.copy(c);
      });
      edgeObjs.forEach((eo, i) => eo.mat.color.copy(col(edgeColorVar(EDGES[i]))));
      flowParts.forEach((p) => p.mat.color.copy(col(p.cv)));
      shellMeshes.forEach((sm) => sm.mat.color.copy(col('--border')));
    }
    const themeObs = new MutationObserver(refreshColors);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // ── 渲染循环（含入场散开 + DOM 标签投影） ──
    const clock = new THREE.Clock();
    const INTRO = 1.6;
    const tmp = new THREE.Vector3();
    let camLastSel = null, camReframe = 0, camWantDist = 500;
    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const introT = Math.min(1, t / INTRO);
      const spread = 0.12 + 0.88 * easeOut(introT);

      // 平滑插值：球的透明度/缩放/光晕向目标值过渡（切换时不再突变）
      const k = 0.16;
      const sel = selectedRef.current;
      const selPulse = 1 + 0.06 * Math.sin(t * 4); // 选中球轻微呼吸
      NODES.forEach((node) => {
        const o = nodeObjs[node.id];
        const isSel = sel === node.id;
        // 目标位置：选中链路 → 绽放布局(上游上半/下游下半)，其余 → 同心球
        const lp = sel && selLayout ? selLayout[node.id] : null;
        const tx = lp ? lp.x : o.finalPos.x * spread;
        const ty = lp ? lp.y : o.finalPos.y * spread;
        const tz = lp ? lp.z : o.finalPos.z * spread;
        if (introT < 1) {
          o.mesh.position.set(tx, ty, tz);
        } else {
          o.mesh.position.x += (tx - o.mesh.position.x) * k;
          o.mesh.position.y += (ty - o.mesh.position.y) * k;
          o.mesh.position.z += (tz - o.mesh.position.z) * k;
        }
        o.mat.opacity += (o.tOp - o.mat.opacity) * k;
        o.glowMat.opacity += (o.tGlow - o.glowMat.opacity) * k;
        o.curScale += (o.tScale * (isSel ? selPulse : 1) - o.curScale) * k;
        o.mesh.scale.setScalar(o.curScale);
        o.curGlow += (o.tGlowScale * (isSel ? selPulse : 1) - o.curGlow) * k;
        o.glow.scale.setScalar(o.curGlow);
        o.glow.position.copy(o.mesh.position);
        // 透明度归零的非链路节点直接隐藏：既不渲染也不可点选
        const vis = o.mat.opacity > 0.02;
        o.mesh.visible = vis;
        o.glow.visible = vis && o.glowMat.opacity > 0.01;
      });
      shellMeshes.forEach((sm) => {
        sm.mesh.scale.setScalar(spread);
        sm.mat.opacity += (sm.tOp - sm.mat.opacity) * k;
      });

      // 主干关联线：入场后渐显；静止态流向粒子顺管流动，选中态淡出
      const edgeFade = Math.max(0, (introT - 0.5) / 0.5);
      edgeObjs.forEach((eo) => {
        const target = introT < 1 ? eo.tOp * edgeFade : eo.tOp;
        eo.mesh.scale.setScalar(spread);
        eo.mat.opacity += (target - eo.mat.opacity) * k;
      });
      if (introT >= 1 && !sel) {
        flowParts.forEach((p) => {
          const tt = (t * 0.13 + p.offset) % 1;
          p.mesh.position.copy(p.curve.getPoint(tt)).multiplyScalar(spread);
          p.mat.opacity = 0.5 + 0.5 * Math.sin(tt * Math.PI);
        });
      } else {
        flowParts.forEach((p) => (p.mat.opacity += (0 - p.mat.opacity) * k));
      }

      // 动态血缘连线：选中态用细圆柱实体在节点间连线（直线无弧，干净不发黑）+ from→to 流向粒子
      if (sel && activeChainEdges.length) {
        const flow = (t * 0.45) % 1;
        for (let i = 0; i < chainLines.length; i++) {
          const cl = chainLines[i];
          const cp = chainParts[i];
          const e = activeChainEdges[i];
          if (!e) {
            cl.mat.opacity += (0 - cl.mat.opacity) * k;
            if (cl.mat.opacity < 0.02) cl.mesh.visible = false;
            cp.mesh.visible = false; cp.mat.opacity = 0;
            continue;
          }
          const a = nodeObjs[e.from].mesh.position;
          const b = nodeObjs[e.to].mesh.position;
          sP.copy(b).sub(a);
          const len = sP.length() || 1;
          sP.divideScalar(len); // 单位方向
          const c = col(edgeColorVar(e));
          cl.mesh.visible = true;
          cl.mesh.position.copy(a).add(b).multiplyScalar(0.5);
          cl.mesh.quaternion.setFromUnitVectors(CYL_UP, sP);
          cl.mesh.scale.set(0.8, len, 0.8); // 实色细连接线，与首页一致
          cl.mat.color.copy(c);
          cl.mat.opacity += (0.85 - cl.mat.opacity) * k;
          // 流向粒子：from→to 直线移动
          const ft = (flow + (i % 5) / 5) % 1;
          cp.mesh.visible = true;
          cp.mesh.position.copy(a).lerp(b, ft);
          cp.mat.color.copy(c);
          cp.mat.opacity = 0.95;
        }
      } else {
        for (let i = 0; i < chainLines.length; i++) {
          const cl = chainLines[i];
          if (cl.mesh.visible) {
            cl.mat.opacity += (0 - cl.mat.opacity) * k;
            if (cl.mat.opacity < 0.02) cl.mesh.visible = false;
          }
          chainParts[i].mesh.visible = false;
          chainParts[i].mat.opacity = 0;
        }
      }

      // DOM 标签：先投影收集候选，再按优先级做屏幕去重叠，避免文字互相遮挡
      const camDist = camera.position.length();
      const near = camDist - SHELL_R[0];
      const span = SHELL_R[0] * 2.2;
      const cands = [];
      NODES.forEach((node) => {
        const o = nodeObjs[node.id];
        const el = o.labelEl;
        tmp.copy(o.mesh.position);
        tmp.y += o.baseR + 5;
        tmp.project(camera);
        if (tmp.z > 1) { el.style.display = 'none'; return; }
        const x = (tmp.x * 0.5 + 0.5) * width;
        const y = (-tmp.y * 0.5 + 0.5) * height;
        let op, scale = 1, hl = false, prio;
        if (sel) {
          if (!currentChain || !currentChain.has(node.id)) { el.style.display = 'none'; return; }
          op = 1; hl = node.id === sel; scale = hl ? 1.25 : 1;
          prio = hl ? 1e7 : 1e4 - o.mesh.position.length(); // 选中最高，其余按离中心近优先
        } else {
          const d = o.mesh.position.distanceTo(camera.position);
          const tt = Math.max(0, Math.min(1, (d - near) / span));
          op = (1 - tt * 0.8) * introT;
          if (node.id === hoverId) { op = 1; scale = 1.3; hl = true; prio = 1e7; }
          else prio = op; // 越近(透明度越高)优先级越高
        }
        if (!o.labelW && el.offsetWidth) { o.labelW = el.offsetWidth; o.labelH = el.offsetHeight; }
        cands.push({ el, x, y, op, scale, hl, prio, w: (o.labelW || 72) * scale, h: (o.labelH || 21) * scale });
      });
      // 高优先级先占位；与已放置标签重叠的低优先级标签淡出隐藏（高亮/选中始终保留）
      cands.sort((p, q) => q.prio - p.prio);
      const placed = [];
      const PAD = 3;
      for (const c of cands) {
        const l = c.x - c.w / 2 - PAD, r = c.x + c.w / 2 + PAD;
        const tp = c.y - c.h / 2 - PAD, bt = c.y + c.h / 2 + PAD;
        let clash = false;
        if (!c.hl) {
          for (const p of placed) {
            if (l < p.r && r > p.l && tp < p.bt && bt > p.tp) { clash = true; break; }
          }
        }
        if (clash) { c.el.style.display = 'none'; continue; }
        placed.push({ l, r, tp, bt });
        c.el.style.display = '';
        c.el.style.opacity = c.op.toFixed(3);
        c.el.style.transform = `translate(${c.x}px, ${c.y}px) translate(-50%, -50%) scale(${c.scale})`;
        c.el.classList.toggle('hl', c.hl);
        c.el.style.zIndex = c.hl ? '6' : '';
      }

      // 选中切换瞬间自动取景：按链路最大半径反推距离，保证整条血缘完整入镜（之后交还用户缩放）
      if (sel !== camLastSel) {
        camLastSel = sel;
        camReframe = 1;
        camWantDist = sel ? Math.max(330, Math.min(800, (selMaxR + 78) / 0.36)) : 500;
      }
      if (camReframe > 0) {
        camReframe = Math.max(0, camReframe - 0.02);
        const curDist = camera.position.length() || 1;
        camera.position.multiplyScalar(1 + (camWantDist / curDist - 1) * 0.08);
      }
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    const ro = new ResizeObserver(() => {
      width = container.clientWidth || width;
      height = container.clientHeight || height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    ro.observe(container);

    apiRef.current = { applySelection };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObs.disconnect();
      dom.removeEventListener('pointermove', onPointerMove);
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      sphereGeo.dispose();
      partGeo.dispose();
      glowTex.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      labelLayer.replaceChildren();
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    selectedRef.current = selected;
    apiRef.current?.applySelection(selected);
  }, [selected]);

  const node = selected ? NODE_BY_ID[selected] : null;
  const inEdges = selected ? EDGES.filter((e) => e.to === selected) : [];
  const outEdges = selected ? EDGES.filter((e) => e.from === selected) : [];
  const isolated = selected && inEdges.length === 0 && outEdges.length === 0;

  return (
    <div className={`lineage-section lineage-graph-3d${selected ? ' has-detail' : ''}${fullscreen ? ' is-fullscreen' : ''}`}>
      <div className="lineage-3d-stage">
        <div className="lineage-3d" ref={mountRef}>
          <div className="l3d-labels" ref={labelsRef} />
          <button
            className="lineage-3d-fs-btn"
            onClick={() => setFullscreen((v) => !v)}
            title={fullscreen ? '退出全屏 (Esc)' : '全屏显示'}
          >
            {fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          </button>
          <div className="lineage-3d-shellhint">
            <span>外层 源字段</span><span>中层 派生·融合</span><span>内核 数据集·API</span>
          </div>
        </div>

        <div className="lineage-3d-panel">
          {node && (
            <div className="lineage-3d-panel-inner">
              <div className="l3d-detail-header">
                <div className="l3d-detail-titles">
                  <h4>{node.cn}</h4>
                  <code>{node.name}</code>
                </div>
                <button className="detail-close" onClick={() => setSelected(null)}>×</button>
              </div>
              <div className="l3d-detail-badges">
                <span className="l3d-badge" style={{ background: `var(${node.v})18`, color: `var(${node.v})` }}>
                  {CAT_LABELS[node.cat] || node.cat}
                </span>
                <span className="l3d-badge l3d-badge-type">{node.type}</span>
              </div>
              <p className="l3d-detail-desc">{node.desc}</p>
              <div className="l3d-rel">
                <h5>血缘关系</h5>
                {isolated && <div className="l3d-rel-empty">独立字段 · 暂无血缘关联（仅随记录保留于数据集）</div>}
                {inEdges.length > 0 && (
                  <div className="l3d-rel-group">
                    <div className="l3d-rel-dir">上游来源</div>
                    {inEdges.map((e) => (
                      <button key={e.from} className="l3d-rel-row" onClick={() => setSelected(e.from)}>
                        <span className="l3d-rel-name">{NODE_BY_ID[e.from].cn}</span>
                        <span className="l3d-rel-arrow">—{REL_WORD[e.type]}→</span>
                        <span className="l3d-rel-self">本字段</span>
                      </button>
                    ))}
                  </div>
                )}
                {outEdges.length > 0 && (
                  <div className="l3d-rel-group">
                    <div className="l3d-rel-dir">下游去向</div>
                    {outEdges.map((e) => (
                      <button key={e.to} className="l3d-rel-row" onClick={() => setSelected(e.to)}>
                        <span className="l3d-rel-self">本字段</span>
                        <span className="l3d-rel-arrow">—{REL_WORD[e.type]}→</span>
                        <span className="l3d-rel-name">{NODE_BY_ID[e.to].cn}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
