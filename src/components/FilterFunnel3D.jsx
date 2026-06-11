import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import '../styles/filterFunnel.css';

// ─── 列级转换类型（column-level transformation） ───
const FATES = {
  filter: { label: '过滤剔除', en: 'FILTER', sub: '质量门控 · 不入库', color: '#fb7185' },
  rename: { label: '标准化重命名', en: 'RENAME', sub: '字段映射统一', color: '#fbbf24' },
  merge: { label: '归并融合', en: 'MERGE', sub: '多源对齐合并', color: '#34d399' },
  derive: { label: '派生计算', en: 'DERIVE', sub: '关键点计算指标', color: '#22d3ee' },
  direct: { label: '直接映射', en: 'DIRECT', sub: '原样透传保留', color: '#8aa0ff' },
};
const FATE_ORDER = ['filter', 'rename', 'merge', 'derive', 'direct'];

// 各转换类型停驻的目标层（沉降终点）
const TERMINAL = { filter: 1, rename: 1, merge: 2, derive: 3, direct: 3 };

// ─── 27 源字段（与血缘图一致），绑定转换类型 ───
const FIELD_POOL = [
  { id: 'user_id', name: 'user_id', cn: '用户ID', type: 'string', cat: '标识', fate: 'filter', rule: '多用户隔离标识，不参与融合', to: '—' },
  { id: 'fps', name: 'fps', cn: '帧率', type: 'int', cat: '帧率/检测', fate: 'filter', rule: '采集质量监控，仅用于门控', to: '—' },
  { id: 'body_detected', name: 'body_detected', cn: '人体检测', type: 'bool', cat: '帧率/检测', fate: 'filter', rule: '质量门控标记，判定后丢弃', to: '—' },
  { id: 'tracking_ready', name: 'tracking_ready', cn: '追踪就绪', type: 'bool', cat: '帧率/检测', fate: 'filter', rule: '质量门控标记，判定后丢弃', to: '—' },

  { id: 'shoulder_tilt_deg', name: 'shoulder_tilt_deg', cn: '颈侧倾角', type: 'float', cat: '体态角度', fate: 'rename', rule: '统一为颈部体态命名', to: 'neck_tilt_deg' },
  { id: 'pelvis_tilt_deg', name: 'pelvis_tilt_deg', cn: '颈旋转角', type: 'float', cat: '体态角度', fate: 'rename', rule: '统一为颈部体态命名', to: 'neck_rotation_deg' },
  { id: 'trunk_shift_percent', name: 'trunk_shift_percent', cn: '肩倾斜角', type: 'float', cat: '体态角度', fate: 'rename', rule: '标准化为业务语义名', to: 'shoulder_slope_deg' },

  { id: 'pose_timestamp', name: 'pose_timestamp', cn: '姿态时间戳', type: 'int64', cat: '时间戳', fate: 'merge', rule: '毫秒级时序对齐（50ms 阈值）', to: 'ts' },
  { id: 'left_pressure_timestamp', name: 'left_pressure_timestamp', cn: '左脚压力时间戳', type: 'int64', cat: '时间戳', fate: 'merge', rule: '与姿态帧时序对齐', to: 'ts' },
  { id: 'right_pressure_timestamp', name: 'right_pressure_timestamp', cn: '右脚压力时间戳', type: 'int64', cat: '时间戳', fate: 'merge', rule: '与姿态帧时序对齐', to: 'ts' },
  { id: 'left_delta_ms', name: 'left_delta_ms', cn: '左脚时间差', type: 'int', cat: '时间差', fate: 'merge', rule: '与右脚共同判定同步质量', to: 'match_status' },
  { id: 'right_delta_ms', name: 'right_delta_ms', cn: '右脚时间差', type: 'int', cat: '时间差', fate: 'merge', rule: '与左脚共同判定同步质量', to: 'match_status' },
  { id: 'left_pressures_json', name: 'left_pressures_json', cn: '左脚压力阵列', type: 'json', cat: '压力数据', fate: 'merge', rule: '清洗标准化后合并', to: 'pressure_data' },
  { id: 'right_pressures_json', name: 'right_pressures_json', cn: '右脚压力阵列', type: 'json', cat: '压力数据', fate: 'merge', rule: '清洗标准化后合并', to: 'pressure_data' },

  { id: 'head_tilt_deg', name: 'head_tilt_deg', cn: '头前倾角', type: 'float', cat: '体态角度', fate: 'derive', rule: '由关键点计算的核心体态指标', to: 'head_tilt_deg' },
  { id: 'total_height', name: 'total_height', cn: '总身高', type: 'float', cat: '身体尺寸', fate: 'derive', rule: '由关键点估算的归一化身高', to: 'total_height' },
  { id: 'shoulder_width', name: 'shoulder_width', cn: '肩宽', type: 'float', cat: '身体尺寸', fate: 'derive', rule: '由关键点估算的肩部宽度', to: 'shoulder_width' },
  { id: 'hip_width', name: 'hip_width', cn: '髋宽', type: 'float', cat: '身体尺寸', fate: 'derive', rule: '由关键点估算的髋部宽度', to: 'hip_width' },
  { id: 'torso_length', name: 'torso_length', cn: '躯干长', type: 'float', cat: '身体尺寸', fate: 'derive', rule: '由关键点估算的躯干长度', to: 'torso_length' },
  { id: 'leg_length', name: 'leg_length', cn: '腿长', type: 'float', cat: '身体尺寸', fate: 'derive', rule: '由关键点估算的腿部长度', to: 'leg_length' },
  { id: 'arm_length', name: 'arm_length', cn: '臂长', type: 'float', cat: '身体尺寸', fate: 'derive', rule: '由关键点估算的手臂长度', to: 'arm_length' },
  { id: 'head_width', name: 'head_width', cn: '头宽', type: 'float', cat: '身体尺寸', fate: 'derive', rule: '由关键点估算的头部宽度', to: 'head_width' },
  { id: 'head_center_x', name: 'head_center_x', cn: '头部中心X', type: 'float', cat: '中心位置', fate: 'derive', rule: '由关键点计算的头部水平中心', to: 'head_center_x' },
  { id: 'shoulder_center_x', name: 'shoulder_center_x', cn: '肩中心X', type: 'float', cat: '中心位置', fate: 'derive', rule: '由关键点计算的肩部水平中心', to: 'shoulder_center_x' },
  { id: 'shoulder_span', name: 'shoulder_span', cn: '肩跨度', type: 'float', cat: '中心位置', fate: 'derive', rule: '由关键点计算的肩部水平跨度', to: 'shoulder_span' },

  { id: 'interval_id', name: 'interval_id', cn: '采样区间ID', type: 'string', cat: '标识', fate: 'direct', rule: '作为数据集主键原样保留', to: 'interval_id' },
  { id: 'match_status', name: 'match_status', cn: '匹配状态', type: 'enum', cat: '匹配状态', fate: 'direct', rule: '融合质量标记原样入库', to: 'match_status' },
];
const FIELD_BY_ID = Object.fromEntries(FIELD_POOL.map((f) => [f.id, f]));
const FATE_COUNT = FATE_ORDER.reduce((m, k) => ({ ...m, [k]: FIELD_POOL.filter((f) => f.fate === k).length }), {});

const STAGES = [
  { y: 210, label: '源数据采集', sub: '27 源字段' },
  { y: 70, label: '过滤与字段映射', sub: '剔除 4 · 重命名 3' },
  { y: -70, label: '双源融合', sub: '归并 7→3' },
  { y: -210, label: '融合数据集入库', sub: '派生 11 · 透传 2' },
];

const HALF_W = 150;
const HALF_D = 92;
const BOUND_X = HALF_W * 0.82;
const BOUND_D = HALF_D * 0.82;
const TOP_Y = STAGES[0].y + 40;
// 每个字段一个球（球上贴字段名）
const INSTANCES = 1;

function roundRectPath(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
}

function makePlaneTexture() {
  const w = 512, h = 320;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const pad = 14, r = 54;
  ctx.beginPath();
  roundRectPath(ctx, pad, pad, w - 2 * pad, h - 2 * pad, r);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(170,188,255,0.34)');
  g.addColorStop(1, 'rgba(96,116,232,0.10)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(150,170,255,0.20)';
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(214,224,255,0.92)';
  ctx.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function FilterFunnel3D() {
  const mountRef = useRef(null);
  const labelsRef = useRef(null);
  const ballLabelsRef = useRef(null);
  const tipRef = useRef(null);
  const selectedRef = useRef(null);
  const hoverRef = useRef(null);
  const fateRef = useRef(null);

  const [selected, setSelected] = useState(null);
  const [hoverField, setHoverField] = useState(null);
  const [fateHi, setFateHi] = useState(null);

  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { hoverRef.current = hoverField; }, [hoverField]);
  useEffect(() => { fateRef.current = fateHi; }, [fateHi]);

  useEffect(() => {
    const container = mountRef.current;
    const labelLayer = labelsRef.current;
    const ballLayer = ballLabelsRef.current;
    const tipEl = tipRef.current;
    if (!container || !labelLayer || !ballLayer) return;

    let width = container.clientWidth || 800;
    let height = container.clientHeight || 540;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 1, 4000);
    camera.position.set(0, 215, 560);
    camera.lookAt(0, -10, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = 'grab';

    // 灯光：半球光给柔和环境 + 方向光给明暗立体（哑光、不发光）
    scene.add(new THREE.HemisphereLight(0xbcd0ff, 0x1a2030, 0.95));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(140, 320, 220);
    scene.add(keyLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.target.set(0, -10, 0);
    controls.minDistance = 360;
    controls.maxDistance = 880;
    controls.minPolarAngle = 0.5;
    controls.maxPolarAngle = 1.35;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;

    // ── 过滤层平面 + DOM 标签 ──
    const planeTex = makePlaneTexture();
    const planeGeo = new THREE.PlaneGeometry(HALF_W * 2, HALF_D * 2);
    const stageObjs = [];
    STAGES.forEach((st) => {
      const mat = new THREE.MeshBasicMaterial({
        map: planeTex, color: new THREE.Color('#8aa0ff'),
        transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, st.y, 0);
      scene.add(mesh);

      const labelEl = document.createElement('div');
      labelEl.className = 'ff-label';
      labelEl.innerHTML = `<b>${st.label}</b><span>${st.sub}</span>`;
      labelLayer.appendChild(labelEl);
      stageObjs.push({ mesh, labelEl, st });
    });

    // ── 竖向数据丝线 ──
    const threadMat = new THREE.LineBasicMaterial({ color: 0x9fb0ff, transparent: true, opacity: 0.1 });
    for (let i = 0; i < 12; i += 1) {
      const tx = (Math.random() * 2 - 1) * HALF_W * 0.92;
      const tz = (Math.random() * 2 - 1) * HALF_D * 0.92;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(tx, TOP_Y, tz),
        new THREE.Vector3(tx * 0.4, STAGES[STAGES.length - 1].y, tz * 0.4),
      ]);
      scene.add(new THREE.Line(geo, threadMat));
    }

    // ── 字段小球 ──
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const particles = [];
    const pickables = [];
    let now = 0;

    function randDrift(p, speed) {
      const a = Math.random() * Math.PI * 2;
      p.dvx = Math.cos(a) * speed;
      p.dvz = Math.sin(a) * speed;
    }

    function respawn(p, scatter) {
      p.x = (Math.random() * 2 - 1) * BOUND_X;
      p.z = (Math.random() * 2 - 1) * BOUND_D;
      p.r = 8 + Math.random() * 3;
      p.phase = Math.random() * Math.PI * 2;
      p.vy = 30 + Math.random() * 14; // 下沉速度（慢）
      p.alpha = 1;
      p.fading = false;
      randDrift(p, 5 + Math.random() * 5);
      if (scatter) {
        // 初始打散到各阶段，避免同时从顶部涌入
        const term = p.terminal;
        const stg = Math.floor(Math.random() * (term + 1));
        if (stg === term) {
          p.state = 'settled';
          p.y = STAGES[term].y + p.r;
          p.timer = now + Math.random() * 12;
        } else {
          p.state = 'falling';
          p.y = STAGES[stg].y - Math.random() * (STAGES[stg].y - STAGES[stg + 1].y);
        }
      } else {
        p.state = 'collect';
        p.y = STAGES[0].y + p.r;
        p.timer = now + 1.4 + Math.random() * 2.4;
      }
    }

    let pi = 0;
    for (let n = 0; n < INSTANCES; n += 1) {
      FIELD_POOL.forEach((field) => {
        const color = new THREE.Color(FATES[field.fate].color);
        const mat = new THREE.MeshStandardMaterial({
          color: color.clone(),
          roughness: 0.85,
          metalness: 0,
          transparent: true,
          opacity: 1,
        });
        const mesh = new THREE.Mesh(sphereGeo, mat);
        mesh.userData.idx = pi;
        scene.add(mesh);
        pickables.push(mesh);
        const labelEl = document.createElement('div');
        labelEl.className = 'ff-ball-label';
        labelEl.textContent = field.name;
        labelEl.style.setProperty('--fc', FATES[field.fate].color);
        ballLayer.appendChild(labelEl);
        const p = { mesh, mat, labelEl, field, terminal: TERMINAL[field.fate], dim: 0, boost: 0 };
        respawn(p, true);
        particles.push(p);
        pi += 1;
      });
    }

    function driftOnPlane(p, dt) {
      p.x += p.dvx * dt;
      p.z += p.dvz * dt;
      if (p.x > BOUND_X || p.x < -BOUND_X) { p.dvx *= -1; p.x = Math.max(-BOUND_X, Math.min(BOUND_X, p.x)); }
      if (p.z > BOUND_D || p.z < -BOUND_D) { p.dvz *= -1; p.z = Math.max(-BOUND_D, Math.min(BOUND_D, p.z)); }
    }

    // 同层停驻球互相推开，避免重叠穿透（平面上的 2D 分离）
    function separate(list) {
      for (let i = 0; i < list.length; i += 1) {
        const a = list[i];
        for (let j = i + 1; j < list.length; j += 1) {
          const b = list[j];
          let dx = a.x - b.x;
          let dz = a.z - b.z;
          const minD = (a.r + b.r) * 0.92;
          let d = Math.hypot(dx, dz);
          if (d >= minD) continue;
          if (d < 1e-3) { dx = Math.random() - 0.5; dz = Math.random() - 0.5; d = Math.hypot(dx, dz) || 1; }
          const push = (minD - d) * 0.5;
          const ux = dx / d;
          const uz = dz / d;
          a.x += ux * push; a.z += uz * push;
          b.x -= ux * push; b.z -= uz * push;
        }
      }
      list.forEach((p) => {
        p.x = Math.max(-BOUND_X, Math.min(BOUND_X, p.x));
        p.z = Math.max(-BOUND_D, Math.min(BOUND_D, p.z));
      });
    }

    // ── 拾取 ──
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0, downY = 0;
    let lastHover = null;
    function pickIdx(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(pickables, false);
      for (const h of hits) {
        const p = particles[h.object.userData.idx];
        if (!p.fading && p.alpha > 0.5) return h.object.userData.idx;
      }
      return -1;
    }
    function onMove(ev) {
      const idx = pickIdx(ev.clientX, ev.clientY);
      const id = idx >= 0 ? particles[idx].field.id : null;
      renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
      if (id !== lastHover) { lastHover = id; setHoverField(id); }
      const rect = container.getBoundingClientRect();
      if (id) {
        const f = FIELD_BY_ID[id];
        tipEl.style.display = '';
        tipEl.style.setProperty('--tc', FATES[f.fate].color);
        tipEl.innerHTML = `<b>${f.name}</b><span>${f.cn} · ${FATES[f.fate].label}</span>`;
        tipEl.style.left = `${ev.clientX - rect.left + 14}px`;
        tipEl.style.top = `${ev.clientY - rect.top + 14}px`;
      } else {
        tipEl.style.display = 'none';
      }
    }
    function onLeave() { lastHover = null; setHoverField(null); tipEl.style.display = 'none'; }
    function onDown(ev) { downX = ev.clientX; downY = ev.clientY; }
    function onUp(ev) {
      if (Math.hypot(ev.clientX - downX, ev.clientY - downY) > 5) return;
      const idx = pickIdx(ev.clientX, ev.clientY);
      const id = idx >= 0 ? particles[idx].field.id : null;
      setSelected((prev) => (id ? (prev === id ? null : id) : prev));
    }
    const dom = renderer.domElement;
    dom.addEventListener('pointermove', onMove);
    dom.addEventListener('pointerleave', onLeave);
    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('pointerup', onUp);

    // ── 渲染循环 ──
    const clock = new THREE.Clock();
    const tmp = new THREE.Vector3();
    const lp = new THREE.Vector3();
    const restGroups = STAGES.map(() => []);
    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      const dt = Math.min(0.05, clock.getDelta());
      now = clock.elapsedTime;

      const sel = selectedRef.current;
      const fate = fateRef.current;
      const hov = hoverRef.current;
      const anyFocus = sel || fate || hov;
      controls.autoRotate = !(sel || hov);

      // 1) 物理状态更新
      particles.forEach((p) => {
        const bob = Math.sin(now * 1.4 + p.phase) * 1.4;
        if (p.state === 'collect') {
          p.y = STAGES[0].y + p.r + bob;
          driftOnPlane(p, dt);
          if (now > p.timer) p.state = 'falling';
        } else if (p.state === 'falling') {
          p.y -= p.vy * dt;
          const termY = STAGES[p.terminal].y;
          if (p.y <= termY + p.r) {
            p.state = 'settled';
            p.y = termY + p.r;
            p.timer = now + 8 + Math.random() * 9;
          }
        } else if (p.state === 'settled') {
          if (p.field.fate === 'merge') {
            // 归并：向融合层中心轴汇聚（分离会把它们挤成一团）
            p.x += (0 - p.x) * Math.min(1, dt * 0.6);
            p.z += (0 - p.z) * Math.min(1, dt * 0.6);
          } else {
            driftOnPlane(p, dt);
          }
          p.y = STAGES[p.terminal].y + p.r + bob;
          if (now > p.timer) p.fading = true;
          if (p.fading) {
            p.alpha -= dt * 0.5;
            if (p.alpha <= 0) respawn(p, false);
          }
        }

        const isFocus = sel ? p.field.id === sel : fate ? p.field.fate === fate : hov ? p.field.id === hov : false;
        p.dim += ((anyFocus && !isFocus ? 1 : 0) - p.dim) * 0.16;
        p.boost += ((isFocus ? 1 : 0) - p.boost) * 0.16;
      });

      // 2) 碰撞分离：同层停驻的球互相推开
      restGroups.forEach((g) => { g.length = 0; });
      particles.forEach((p) => {
        if (p.fading) return;
        if (p.state === 'settled') restGroups[p.terminal].push(p);
        else if (p.state === 'collect') restGroups[0].push(p);
      });
      restGroups.forEach((g) => { if (g.length > 1) separate(g); });

      // 3) 应用到网格 + 字段名标签
      particles.forEach((p) => {
        const pulse = 1 + 0.05 * Math.sin(now * 2.5 + p.phase) + 0.32 * p.boost;
        const opacityFactor = 1 - 0.86 * p.dim;
        p.mesh.position.set(p.x, p.y, p.z);
        p.mesh.scale.setScalar(p.r * pulse);
        p.mat.opacity = p.alpha * opacityFactor;

        const el = p.labelEl;
        lp.copy(p.mesh.position);
        lp.y += p.r + 6;
        lp.project(camera);
        if (lp.z > 1 || p.alpha < 0.55) {
          el.style.display = 'none';
        } else {
          el.style.display = '';
          const lx = (lp.x * 0.5 + 0.5) * width;
          const ly = (-lp.y * 0.5 + 0.5) * height;
          el.style.transform = `translate(${lx}px, ${ly}px) translate(-50%, -100%)`;
          el.style.opacity = (opacityFactor * Math.min(1, p.alpha)).toFixed(2);
          el.style.zIndex = p.boost > 0.5 ? '4' : '';
        }
      });

      stageObjs.forEach((o) => {
        tmp.set(HALF_W + 6, o.st.y, -HALF_D);
        tmp.project(camera);
        const el = o.labelEl;
        if (tmp.z > 1) { el.style.display = 'none'; return; }
        el.style.display = '';
        const x = (tmp.x * 0.5 + 0.5) * width;
        const y = (-tmp.y * 0.5 + 0.5) * height;
        el.style.transform = `translate(${x}px, ${y}px) translateY(-50%)`;
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

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerleave', onLeave);
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointerup', onUp);
      controls.dispose();
      sphereGeo.dispose();
      planeGeo.dispose();
      planeTex.dispose();
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
      ballLayer.replaceChildren();
    };
  }, []);

  const shown = selected ? FIELD_BY_ID[selected] : hoverField ? FIELD_BY_ID[hoverField] : null;
  const toVerb = { filter: '✕ 过滤剔除，不入库', rename: '重命名为 ', merge: '归并入 ', derive: '派生计算 → ', direct: '原样保留 ' };

  return (
    <div className="ff-section">
      <div className="ff-stage" ref={mountRef}>
        <div className="ff-ball-labels" ref={ballLabelsRef} />
        <div className="ff-labels" ref={labelsRef} />
        <div className="ff-tip" ref={tipRef} />
        <div className="ff-hint">悬停看字段 · 点击钉住高亮 · 拖拽旋转 · 滚轮缩放</div>
      </div>

      <aside className="ff-side">
        <div className="ff-funnel">
          <div className="ff-funnel-top"><strong>27</strong> 源字段</div>
          <div className="ff-funnel-arrow">过滤 · 映射 · 融合 ↓</div>
          <div className="ff-funnel-bottom"><strong>19</strong> 标准化字段入库</div>
        </div>

        <div className="ff-fates">
          <div className="ff-fates-title">字段级转换类型</div>
          {FATE_ORDER.map((k) => {
            const f = FATES[k];
            const active = fateHi === k;
            return (
              <button
                key={k}
                type="button"
                className={`ff-fate-row${active ? ' active' : ''}`}
                style={{ '--fc': f.color }}
                onClick={() => setFateHi((p) => (p === k ? null : k))}
                onMouseEnter={() => !selected && setFateHi(k)}
                onMouseLeave={() => !selected && setFateHi((p) => (p === k ? null : p))}
              >
                <i className="ff-fate-dot" />
                <span className="ff-fate-label">{f.label}</span>
                <span className="ff-fate-sub">{f.en} · {f.sub}</span>
                <span className="ff-fate-count">{k === 'merge' ? '7→3' : FATE_COUNT[k]}</span>
              </button>
            );
          })}
        </div>

        <div className="ff-detail">
          {shown ? (
            <div className="ff-detail-card" style={{ '--fc': FATES[shown.fate].color }}>
              <div className="ff-detail-head">
                <h4>{shown.cn}</h4>
                {selected && <button className="ff-detail-close" onClick={() => setSelected(null)}>×</button>}
              </div>
              <code className="ff-detail-name">{shown.name}</code>
              <div className="ff-detail-badges">
                <span className="ff-badge ff-badge-fate">{FATES[shown.fate].label}</span>
                <span className="ff-badge">{shown.type}</span>
                <span className="ff-badge">{shown.cat}</span>
              </div>
              <p className="ff-detail-rule">{shown.rule}</p>
              <div className="ff-detail-to">
                <span className="ff-detail-to-label">转换结果</span>
                {shown.fate === 'filter' ? (
                  <span className="ff-detail-to-drop">{toVerb.filter}</span>
                ) : (
                  <span className="ff-detail-to-name">
                    {toVerb[shown.fate]}<code>{shown.to}</code>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="ff-detail-empty">
              悬停或点击左侧小球查看字段详情<br />
              点击右侧转换类型可高亮该类全部字段
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
