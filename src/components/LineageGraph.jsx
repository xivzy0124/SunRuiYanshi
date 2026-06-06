import { useState, useRef, useEffect } from 'react';
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

const PROC = [
  { id: 'proc:ts', name: 'ts', cn: '统一时间戳', type: 'int64', cat: '融合', v: '--green', desc: '毫秒级对齐后的统一时间戳，双流融合主键。' },
  { id: 'proc:pressure_data', name: 'pressure_data', cn: '融合压力数据', type: 'float[]', cat: '融合', v: '--green', desc: '左右脚压力清洗标准化后的融合压力数据。' },
  { id: 'proc:pose_data', name: 'pose_data', cn: '融合姿态数据', type: 'object', cat: '融合', v: '--green', desc: '关键点清洗标准化后的融合姿态数据。' },
  { id: 'out:db', name: 't_fusion_health_dataset', cn: '体态健康数据集', type: 'table', cat: '输出', v: '--orange', desc: '融合后的标准化持久化数据集，沉淀为专属体态健康数据。' },
  { id: 'out:api', name: '/api/v1/latest', cn: 'API 接口', type: 'endpoint', cat: '输出', v: '--orange', desc: '对外发布的标准化数据接口，供后续模块实时调用。' },
];

const NODES = [...FIELDS, ...PROC];
const NODE_BY_ID = Object.fromEntries(NODES.map((n) => [n.id, n]));

const DERIVED = [
  'head_tilt_deg', 'shoulder_tilt_deg', 'pelvis_tilt_deg', 'trunk_shift_percent',
  'total_height', 'shoulder_width', 'hip_width', 'torso_length', 'leg_length', 'arm_length', 'head_width',
  'head_center_x', 'shoulder_center_x', 'shoulder_span',
];

const EDGES = [
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
  converge: '汇入融合', carry: '携带入库', publish: '对外发布',
};
const REL_COLORVAR = { match: '--green', converge: '--green', publish: '--orange' };
function edgeColorVar(edge) { return REL_COLORVAR[edge.type] || NODE_BY_ID[edge.from].v; }

const CAT_LABELS = {
  标识: '标识', 时间戳: '时间戳', 时间差: '时间差', 压力数据: '压力数据', 匹配状态: '匹配状态',
  '帧率/检测': '帧率/检测', 体态角度: '体态角度', 身体尺寸: '身体尺寸', 中心位置: '中心位置',
  关键点: '关键点', 融合: '融合处理', 输出: '输出',
};

// ─── 同心球壳：外层=源字段 / 中层=派生·融合 / 内核=输出 ───
const SHELL_R = [168, 96, 24];
function shellOf(node) {
  if (node.id.startsWith('out:')) return 2;
  if (['体态角度', '身体尺寸', '中心位置', '融合', '匹配状态'].includes(node.cat)) return 1;
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

function computeLineageChain(selectedId) {
  const upstream = new Set();
  const downstream = new Set();
  let queue = [selectedId];
  let visited = new Set([selectedId]);
  while (queue.length) {
    const current = queue.shift();
    for (const edge of EDGES) {
      if (edge.to === current && !visited.has(edge.from)) { visited.add(edge.from); upstream.add(edge.from); queue.push(edge.from); }
    }
  }
  queue = [selectedId];
  visited = new Set([selectedId]);
  while (queue.length) {
    const current = queue.shift();
    for (const edge of EDGES) {
      if (edge.from === current && !visited.has(edge.to)) { visited.add(edge.to); downstream.add(edge.to); queue.push(edge.to); }
    }
  }
  return { chain: new Set([selectedId, ...upstream, ...downstream]), upstream, downstream };
}

function baseRadius(node) {
  if (node.id === 'out:db') return 11;
  if (node.id === 'out:api') return 9;
  if (node.cat === '融合') return 7;
  if (node.cat === '压力数据' || node.cat === '关键点') return 6.4;
  return 5.4;
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

    // 半透明壳层导引球（让"同心分层"结构更直观）
    const shellMeshes = [];
    [0, 1].forEach((s) => {
      const geo = new THREE.SphereGeometry(SHELL_R[s], 32, 24);
      const mat = new THREE.MeshBasicMaterial({
        color: col('--border').clone(), transparent: true, opacity: 0.05,
        wireframe: true, depthWrite: false,
      });
      const m = new THREE.Mesh(geo, mat);
      scene.add(m);
      shellMeshes.push({ mesh: m, mat });
    });

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

    // ── 边（轻微内凹弧线，体现向核心汇聚） + 流动粒子 ──
    const edgeObjs = [];
    const particles = [];
    const partGeo = new THREE.SphereGeometry(1.3, 10, 10);
    EDGES.forEach((e, i) => {
      const a = nodeObjs[e.from].finalPos;
      const b = nodeObjs[e.to].finalPos;
      const mid = a.clone().add(b).multiplyScalar(0.5).multiplyScalar(0.86);
      const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
      // 派生/携带是密集簇（landmarks 扇出、out:db 汇入），默认收起，仅选中相关节点时点亮
      const dense = e.type === 'derive' || e.type === 'carry';
      const tubeGeo = new THREE.TubeGeometry(curve, 32, dense ? 0.34 : 0.55, 6, false);
      const cv = edgeColorVar(e);
      const baseOpacity = dense ? 0 : 0.4;
      const mat = new THREE.MeshBasicMaterial({ color: col(cv).clone(), transparent: true, opacity: 0 });
      const tube = new THREE.Mesh(tubeGeo, mat);
      scene.add(tube);
      edgeObjs.push({ from: e.from, to: e.to, mat, baseOpacity });

      const pMat = new THREE.MeshBasicMaterial({ color: col(cv).clone(), transparent: true, opacity: 0 });
      const pMesh = new THREE.Mesh(partGeo, pMat);
      scene.add(pMesh);
      particles.push({ mesh: pMesh, mat: pMat, curve, offset: (i % 9) / 9, cv, dense });
    });

    // ── 高亮目标：选中/悬停只更新"目标值"，由渲染循环平滑插值过渡 ──
    let currentChain = null;
    let hoverId = null;
    function updateTargets() {
      const selId = selectedRef.current;
      currentChain = selId ? computeLineageChain(selId).chain : null;
      const ch = currentChain;
      NODES.forEach((node) => {
        const o = nodeObjs[node.id];
        const inChain = !ch || ch.has(node.id);
        const isSel = selId === node.id;
        const isHover = !selId && hoverId === node.id; // 选中态不叠加悬停
        o.tOp = inChain ? 1 : 0.07;
        o.tGlow = isSel ? 1 : isHover ? 0.85 : inChain ? 0.5 : 0.02;
        o.tScale = (isSel ? 1.6 : isHover ? 1.22 : 1) * o.baseR;
        o.tGlowScale = (isSel ? 1.5 : 1) * o.glowBase;
      });
      edgeObjs.forEach((eo) => {
        const inChain = !ch || (ch.has(eo.from) && ch.has(eo.to));
        eo.tOp = ch ? (inChain ? 0.9 : 0.02) : eo.baseOpacity;
      });
      shellMeshes.forEach((sm) => (sm.tOp = ch ? 0.02 : 0.05));
    }
    const applySelection = () => updateTargets();
    function setHover(id) {
      if (hoverId === id) return;
      hoverId = id;
      updateTargets();
    }
    shellMeshes.forEach((sm) => (sm.tOp = 0.05));
    edgeObjs.forEach((eo) => (eo.tOp = eo.baseOpacity));

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
      if (hits.length) return hits[0].object.userData.id;
      // 屏幕就近兜底：射线没命中时，取点击位置 30px 内最靠前的节点
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      let best = null;
      let bestD = 30;
      NODES.forEach((node) => {
        const o = nodeObjs[node.id];
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
      particles.forEach((p) => p.mat.color.copy(col(p.cv)));
      shellMeshes.forEach((sm) => sm.mat.color.copy(col('--border')));
    }
    const themeObs = new MutationObserver(refreshColors);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // ── 渲染循环（含入场散开 + DOM 标签投影） ──
    const clock = new THREE.Clock();
    const INTRO = 1.6;
    const tmp = new THREE.Vector3();
    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const introT = Math.min(1, t / INTRO);
      const spread = 0.12 + 0.88 * easeOut(introT);

      // 平滑插值：球的透明度/缩放/光晕向目标值过渡（切换时不再突变）
      const k = 0.16;
      const selPulse = 1 + 0.06 * Math.sin(t * 4); // 选中球轻微呼吸
      NODES.forEach((node) => {
        const o = nodeObjs[node.id];
        o.mesh.position.copy(o.finalPos).multiplyScalar(spread);
        const isSel = selectedRef.current === node.id;
        o.mat.opacity += (o.tOp - o.mat.opacity) * k;
        o.glowMat.opacity += (o.tGlow - o.glowMat.opacity) * k;
        o.curScale += (o.tScale * (isSel ? selPulse : 1) - o.curScale) * k;
        o.mesh.scale.setScalar(o.curScale);
        o.curGlow += (o.tGlowScale * (isSel ? selPulse : 1) - o.curGlow) * k;
        o.glow.scale.setScalar(o.curGlow);
        o.glow.position.copy(o.mesh.position);
      });
      shellMeshes.forEach((sm) => {
        sm.mesh.scale.setScalar(spread);
        sm.mat.opacity += (sm.tOp - sm.mat.opacity) * k;
      });

      const edgeFade = Math.max(0, (introT - 0.5) / 0.5);
      if (introT < 1) {
        edgeObjs.forEach((eo) => (eo.mat.opacity = eo.baseOpacity * edgeFade));
        particles.forEach((p) => (p.mat.opacity = 0));
      } else {
        edgeObjs.forEach((eo) => (eo.mat.opacity += (eo.tOp - eo.mat.opacity) * k));
      }
      if (introT >= 1 && !selectedRef.current) {
        particles.forEach((p) => {
          if (p.dense) { p.mat.opacity = 0; return; } // 密集簇默认不流动
          const tt = (t * 0.14 + p.offset) % 1;
          p.mesh.position.copy(p.curve.getPoint(tt));
          p.mesh.material.opacity = 0.35 + 0.5 * Math.sin(tt * Math.PI);
        });
      } else {
        particles.forEach((p) => (p.mat.opacity = 0));
      }

      // DOM 标签：投影到屏幕；未选中常显+深度淡化，选中只显示链路
      const sel = selectedRef.current;
      const camDist = camera.position.length();
      const near = camDist - SHELL_R[0];
      const span = SHELL_R[0] * 2.2;
      NODES.forEach((node) => {
        const o = nodeObjs[node.id];
        const el = o.labelEl;
        tmp.copy(o.mesh.position);
        tmp.y += o.baseR + 5;
        tmp.project(camera);
        if (tmp.z > 1) { el.style.display = 'none'; return; }
        const x = (tmp.x * 0.5 + 0.5) * width;
        const y = (-tmp.y * 0.5 + 0.5) * height;
        let op, scale = 1, hl = false;
        if (sel) {
          if (!currentChain || !currentChain.has(node.id)) { el.style.display = 'none'; return; }
          op = 1; hl = node.id === sel; scale = hl ? 1.25 : 1;
        } else {
          const d = o.mesh.position.distanceTo(camera.position);
          const tt = Math.max(0, Math.min(1, (d - near) / span));
          op = (1 - tt * 0.8) * introT;
          if (node.id === hoverId) { op = 1; scale = 1.3; hl = true; }
        }
        el.style.display = '';
        el.style.opacity = op.toFixed(3);
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
        el.classList.toggle('hl', hl);
        el.style.zIndex = hl ? '6' : '';
      });

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
    <div className={`lineage-section lineage-graph-3d${selected ? ' has-detail' : ''}`}>
      <div className="lineage-3d-stage">
        <div className="lineage-3d" ref={mountRef}>
          <div className="l3d-labels" ref={labelsRef} />
          <div className="lineage-3d-hint">拖拽旋转 · 滚轮缩放 · 点击节点查看血缘关系</div>
          <div className="lineage-3d-legend">
            <span><i style={{ background: 'var(--accent)' }} />足底压力</span>
            <span><i style={{ background: 'var(--cyan)' }} />姿态/体态</span>
            <span><i style={{ background: 'var(--green)' }} />融合</span>
            <span><i style={{ background: 'var(--orange)' }} />输出</span>
            <span><i style={{ background: 'var(--muted)' }} />标识/质量</span>
          </div>
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
