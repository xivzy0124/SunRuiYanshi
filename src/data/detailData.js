// ─── Field-Level Data Lineage (default export) ───
const fieldDetails = {
  // ═══════════════════════════════════════════
  //  PRESSURE PIPELINE — Source
  // ═══════════════════════════════════════════
  'src:p:timestamp_ms': {
    title: 'timestamp_ms',
    body: '<p>原始时间戳字段，类型 <strong>int64</strong>，单位毫秒，记录每帧采样的精确时刻。</p>',
    fieldType: 'int64',
    stage: 'source',
    pipeline: 'pressure',
    transform: null,
    upstream: [],
    downstream: ['flt:p:timestamp_ms'],
    code: `<span class="cm">// 足底压力 API 输入</span>
{
  <span class="str">"source_type"</span>: <span class="str">"rest_api"</span>,
  <span class="str">"endpoint"</span>: <span class="str">"/api/pressure/stream"</span>,
  <span class="str">"fields"</span>: [<span class="str">"timestamp_ms"</span>, ...]
}`,
  },
  'src:p:sensor_values': {
    title: 'sensor_values[18]',
    body: '<p>18 个足底压力传感器区域的实时采样值，类型 <strong>float[]</strong>，覆盖前掌、中足、后跟等关键区域。</p>',
    fieldType: 'float[]',
    stage: 'source',
    pipeline: 'pressure',
    transform: null,
    upstream: [],
    downstream: ['flt:p:sensor_values'],
    code: `<span class="cm">// 足底压力 API 输入</span>
{
  <span class="str">"fields"</span>: [
    <span class="str">"timestamp_ms"</span>,
    <span class="str">"sensor_values[18]"</span>,
    <span class="str">"valid_frame"</span>
  ]
}`,
  },
  'src:p:valid_frame': {
    title: 'valid_frame',
    body: '<p>帧有效性标志，类型 <strong>bool</strong>。用于下游过滤阶段判断该帧是否可纳入分析。</p>',
    fieldType: 'bool',
    stage: 'source',
    pipeline: 'pressure',
    transform: null,
    upstream: [],
    downstream: [],
    code: `<span class="cm">// 用于过滤规则</span>
{
  <span class="str">"field"</span>: <span class="str">"valid_frame"</span>,
  <span class="str">"op"</span>: <span class="str">"=="</span>,
  <span class="str">"value"</span>: <span class="kw">true</span>
}`,
  },
  'src:p:raw_buffer': {
    title: 'raw_buffer',
    body: '<p>原始二进制缓冲区，类型 <strong>bytes</strong>。在过滤阶段被<strong>丢弃</strong>，不参与后续处理。</p>',
    fieldType: 'bytes',
    stage: 'source',
    pipeline: 'pressure',
    transform: null,
    dropped: true,
    upstream: [],
    downstream: [],
    code: `<span class="cm">// 被过滤规则丢弃</span>
<span class="cm">// "drop": ["raw_buffer", "crc", "device_id"]</span>`,
  },
  'src:p:crc': {
    title: 'crc',
    body: '<p>循环冗余校验值，类型 <strong>uint16</strong>。仅用于传输完整性校验，在过滤阶段<strong>丢弃</strong>。</p>',
    fieldType: 'uint16',
    stage: 'source',
    pipeline: 'pressure',
    transform: null,
    dropped: true,
    upstream: [],
    downstream: [],
    code: `<span class="cm">// 被过滤规则丢弃</span>`,
  },
  'src:p:device_id': {
    title: 'device_id',
    body: '<p>设备标识符，类型 <strong>string</strong>。用于溯源但不参与计算，在过滤阶段<strong>丢弃</strong>。</p>',
    fieldType: 'string',
    stage: 'source',
    pipeline: 'pressure',
    transform: null,
    dropped: true,
    upstream: [],
    downstream: [],
    code: `<span class="cm">// 被过滤规则丢弃</span>`,
  },

  // ═══════════════════════════════════════════
  //  PRESSURE PIPELINE — Filter
  // ═══════════════════════════════════════════
  'flt:p:timestamp_ms': {
    title: 'timestamp_ms (filtered)',
    body: '<p>经多维校验保留的时间戳字段。依次执行：<strong>无效帧剔除</strong>（valid_frame != true）、<strong>空值处理</strong>（sensor_values 为 null 或长度 != 18）、<strong>异常值检测</strong>（传感器读数超出 [0, 4096] 量程范围）。原始 10,752 条 → 过滤后 9,238 条，剔除率 14.1%。</p>',
    fieldType: 'int64',
    stage: 'filter',
    pipeline: 'pressure',
    transform: { type: 'passthrough', rule: 'valid_frame == true && sensor_values not_null && len == 18 && range [0,4096]' },
    upstream: ['src:p:timestamp_ms'],
    downstream: ['map:p:ts'],
    code: `<span class="cm">// 足底压力 - 数据过滤（多维校验）</span>
{
  <span class="str">"rules"</span>: [
    { <span class="str">"field"</span>: <span class="str">"valid_frame"</span>, <span class="str">"op"</span>: <span class="str">"=="</span>, <span class="str">"value"</span>: <span class="kw">true</span>, <span class="str">"desc"</span>: <span class="str">"剔除无效帧"</span> },
    { <span class="str">"field"</span>: <span class="str">"sensor_values"</span>, <span class="str">"op"</span>: <span class="str">"not_null"</span>, <span class="str">"desc"</span>: <span class="str">"空值处理"</span> },
    { <span class="str">"field"</span>: <span class="str">"sensor_values"</span>, <span class="str">"op"</span>: <span class="str">"len"</span>, <span class="str">"value"</span>: <span class="num">18</span>, <span class="str">"desc"</span>: <span class="str">"数组完整性校验"</span> },
    { <span class="str">"field"</span>: <span class="str">"sensor_values[*]"</span>, <span class="str">"op"</span>: <span class="str">"range"</span>, <span class="str">"min"</span>: <span class="num">0</span>, <span class="str">"max"</span>: <span class="num">4096</span>, <span class="str">"desc"</span>: <span class="str">"异常值检测（量程越界）"</span> }
  ],
  <span class="str">"null_strategy"</span>: <span class="str">"drop_row"</span>,
  <span class="str">"anomaly_strategy"</span>: <span class="str">"drop_row"</span>,
  <span class="str">"action"</span>: <span class="str">"drop_invalid"</span>
}`,
  },
  'flt:p:sensor_values': {
    title: 'sensor_values[18] (filtered)',
    body: '<p>经多维校验保留的传感器数据数组。通过<strong>空值剔除</strong>（null / NaN）、<strong>数组长度校验</strong>（必须为 18 元素）、<strong>量程异常值过滤</strong>（0–4096 ADC 范围）后，进入字段映射阶段。</p>',
    fieldType: 'float[]',
    stage: 'filter',
    pipeline: 'pressure',
    transform: { type: 'passthrough', rule: 'valid_frame == true && sensor_values not_null && len == 18 && range [0,4096]' },
    upstream: ['src:p:sensor_values'],
    downstream: ['map:p:pressure_data'],
    code: `<span class="cm">// 同上过滤规则</span>`,
  },

  // ═══════════════════════════════════════════
  //  PRESSURE PIPELINE — Map
  // ═══════════════════════════════════════════
  'map:p:ts': {
    title: 'ts',
    body: '<p>由 <strong>timestamp_ms</strong> 重命名而来，统一时间戳字段名。映射阶段执行<strong>重复时间戳合并</strong>（同一毫秒内多帧取均值）和<strong>格式规整</strong>（精度 4 位小数）。9,238 条 → 9,107 条，合并重复帧 131 条。</p>',
    fieldType: 'int64',
    stage: 'map',
    pipeline: 'pressure',
    transform: { type: 'rename', from: 'timestamp_ms', to: 'ts', note: 'dedup on ts, merge by mean' },
    upstream: ['flt:p:timestamp_ms'],
    downstream: ['join:merged:ts'],
    code: `<span class="cm">// 足底压力 - 字段映射</span>
{
  <span class="str">"mapping"</span>: {
    <span class="str">"timestamp_ms"</span>: <span class="str">"ts"</span>,
    <span class="str">"sensor_values"</span>: <span class="str">"pressure_data"</span>
  },
  <span class="str">"dedup"</span>: { <span class="str">"key"</span>: <span class="str">"ts"</span>, <span class="str">"strategy"</span>: <span class="str">"mean"</span> },
  <span class="str">"normalize"</span>: { <span class="str">"ts_unit"</span>: <span class="str">"ms"</span>, <span class="str">"precision"</span>: <span class="num">4</span> }
}`,
  },
  'map:p:pressure_data': {
    title: 'pressure_data',
    body: '<p>由 <strong>sensor_values</strong> 重命名而来，标准化为 float[] 格式，精度 4 位小数。重复时间戳帧的传感器值取算术平均后合并。</p>',
    fieldType: 'float[]',
    stage: 'map',
    pipeline: 'pressure',
    transform: { type: 'rename', from: 'sensor_values', to: 'pressure_data' },
    upstream: ['flt:p:sensor_values'],
    downstream: ['calc:p:center_of_gravity', 'calc:p:cop_x', 'calc:p:cop_y', 'calc:p:pressure_index', 'calc:p:lr_balance', 'calc:p:peak_pressure', 'join:merged:pressure_data'],
    code: `<span class="cm">// 同上映射规则</span>`,
  },

  // ═══════════════════════════════════════════
  //  PRESSURE PIPELINE — Calc
  // ═══════════════════════════════════════════
  'calc:p:center_of_gravity': {
    title: 'center_of_gravity',
    body: '<p>由 <strong>pressure_data</strong> 与 <strong>sensor_positions</strong> 加权平均计算得出，精度 2 位小数。反映足底压力重心位置，用于平衡能力评估。</p>',
    fieldType: 'float',
    stage: 'calc',
    pipeline: 'pressure',
    transform: { type: 'derive', formula: 'weighted_avg(pressure_data, sensor_positions)', precision: 2 },
    upstream: ['map:p:pressure_data'],
    downstream: ['join:merged:calc_fields'],
    code: `<span class="cm">// 足底压力 - 字段计算</span>
{
  <span class="str">"field"</span>: <span class="str">"center_of_gravity"</span>,
  <span class="str">"formula"</span>: <span class="str">"weighted_avg(pressure_data, sensor_positions)"</span>,
  <span class="str">"precision"</span>: <span class="num">2</span>
}`,
  },
  'calc:p:cop_x': {
    title: 'cop_x',
    body: '<p>压力中心 X 坐标，公式 <strong>sum(p_i * x_i) / sum(p_i)</strong>。用于分析左右脚压力分布与步态稳定性。</p>',
    fieldType: 'float',
    stage: 'calc',
    pipeline: 'pressure',
    transform: { type: 'derive', formula: 'sum(p_i * x_i) / sum(p_i)' },
    upstream: ['map:p:pressure_data'],
    downstream: ['join:merged:calc_fields'],
    code: `<span class="cm">// 压力中心 X 坐标</span>
{
  <span class="str">"field"</span>: <span class="str">"cop_x"</span>,
  <span class="str">"formula"</span>: <span class="str">"sum(p_i * x_i) / sum(p_i)"</span>
}`,
  },
  'calc:p:cop_y': {
    title: 'cop_y',
    body: '<p>压力中心 Y 坐标，公式 <strong>sum(p_i * y_i) / sum(p_i)</strong>。用于分析前后脚压力分布与重心偏移趋势。</p>',
    fieldType: 'float',
    stage: 'calc',
    pipeline: 'pressure',
    transform: { type: 'derive', formula: 'sum(p_i * y_i) / sum(p_i)' },
    upstream: ['map:p:pressure_data'],
    downstream: ['join:merged:calc_fields'],
    code: `<span class="cm">// 压力中心 Y 坐标</span>
{
  <span class="str">"field"</span>: <span class="str">"cop_y"</span>,
  <span class="str">"formula"</span>: <span class="str">"sum(p_i * y_i) / sum(p_i)"</span>
}`,
  },
  'calc:p:pressure_index': {
    title: 'pressure_index',
    body: '<p>压强分布指数，反映 18 个传感器区域的压力均匀程度。公式：<strong>std(pressure_data) / mean(pressure_data)</strong>，值越大表示压力越集中。用于评估足底压力分散/集中特征。</p>',
    fieldType: 'float',
    stage: 'calc',
    pipeline: 'pressure',
    transform: { type: 'derive', formula: 'std(pressure_data) / mean(pressure_data)', precision: 4 },
    upstream: ['map:p:pressure_data'],
    downstream: ['join:merged:calc_fields'],
    code: `<span class="cm">// 压强分布指数</span>
{
  <span class="str">"field"</span>: <span class="str">"pressure_index"</span>,
  <span class="str">"formula"</span>: <span class="str">"std(pressure_data) / mean(pressure_data)"</span>,
  <span class="str">"precision"</span>: <span class="num">4</span>,
  <span class="str">"desc"</span>: <span class="str">"变异系数，反映压力均匀度"</span>
}`,
  },
  'calc:p:lr_balance': {
    title: 'lr_balance',
    body: '<p>左右脚压力平衡比，基于 COP X 坐标与传感器空间分布计算。公式：<strong>sum(left_sensors) / sum(all_sensors)</strong>，0.5 为完美平衡。偏离越大表示一侧负重越多。</p>',
    fieldType: 'float',
    stage: 'calc',
    pipeline: 'pressure',
    transform: { type: 'derive', formula: 'sum(left_half_sensors) / sum(all_sensors)', range: [0, 1] },
    upstream: ['map:p:pressure_data'],
    downstream: ['join:merged:calc_fields'],
    code: `<span class="cm">// 左右脚压力平衡比</span>
{
  <span class="str">"field"</span>: <span class="str">"lr_balance"</span>,
  <span class="str">"formula"</span>: <span class="str">"sum(left_half) / sum(all)"</span>,
  <span class="str">"ideal"</span>: <span class="num">0.5</span>,
  <span class="str">"desc"</span>: <span class="str">"0.5 = 完美平衡"</span>
}`,
  },
  'calc:p:peak_pressure': {
    title: 'peak_pressure',
    body: '<p>峰值压强，取 18 个传感器中的<strong>最大值</strong>。用于检测高压区域（如足底筋膜炎风险区域），单位与原始传感器量程一致。</p>',
    fieldType: 'float',
    stage: 'calc',
    pipeline: 'pressure',
    transform: { type: 'derive', formula: 'max(pressure_data)' },
    upstream: ['map:p:pressure_data'],
    downstream: ['join:merged:calc_fields'],
    code: `<span class="cm">// 峰值压强</span>
{
  <span class="str">"field"</span>: <span class="str">"peak_pressure"</span>,
  <span class="str">"formula"</span>: <span class="str">"max(pressure_data)"</span>,
  <span class="str">"desc"</span>: <span class="str">"单帧最大传感器读数"</span>
}`,
  },

  // ═══════════════════════════════════════════
  //  POSTURE PIPELINE — Source
  // ═══════════════════════════════════════════
  'src:o:frame_timestamp': {
    title: 'frame_timestamp',
    body: '<p>姿态估计帧时间戳，类型 <strong>int64</strong>，单位毫秒。与足底压力时间戳对齐实现多源融合。</p>',
    fieldType: 'int64',
    stage: 'source',
    pipeline: 'posture',
    transform: null,
    upstream: [],
    downstream: ['flt:o:frame_timestamp'],
    code: `<span class="cm">// 三维姿态 API 输入</span>
{
  <span class="str">"source_type"</span>: <span class="str">"rest_api"</span>,
  <span class="str">"endpoint"</span>: <span class="str">"/api/posture/stream"</span>,
  <span class="str">"fields"</span>: [<span class="str">"frame_timestamp"</span>, ...]
}`,
  },
  'src:o:landmarks_xyz': {
    title: 'landmarks[33].x/y/z',
    body: '<p>33 个关键点的三维坐标，类型 <strong>float[]</strong>。覆盖头部、肩、肘、腕、髋、膝、踝等关节。</p>',
    fieldType: 'float[]',
    stage: 'source',
    pipeline: 'posture',
    transform: null,
    upstream: [],
    downstream: ['flt:o:landmarks'],
    code: `<span class="cm">// 三维姿态 API 输入</span>
{
  <span class="str">"fields"</span>: [
    <span class="str">"frame_timestamp"</span>,
    <span class="str">"landmarks[33].x"</span>,
    <span class="str">"landmarks[33].y"</span>,
    <span class="str">"landmarks[33].z"</span>,
    <span class="str">"landmarks[33].visibility"</span>
  ]
}`,
  },
  'src:o:landmarks_vis': {
    title: 'landmarks[33].visibility',
    body: '<p>33 个关键点的置信度分数，类型 <strong>float[]</strong>。用于过滤阶段剔除低质量关节点。</p>',
    fieldType: 'float[]',
    stage: 'source',
    pipeline: 'posture',
    transform: null,
    upstream: [],
    downstream: ['flt:o:landmarks'],
    code: `<span class="cm">// 置信度过滤阈值: 0.85</span>`,
  },
  'src:o:model_version': {
    title: 'model_version',
    body: '<p>推理模型版本号，类型 <strong>string</strong>。用于溯源但不参与计算，在过滤阶段<strong>丢弃</strong>。</p>',
    fieldType: 'string',
    stage: 'source',
    pipeline: 'posture',
    transform: null,
    dropped: true,
    upstream: [],
    downstream: [],
    code: `<span class="cm">// 被过滤规则丢弃</span>`,
  },
  'src:o:raw_inference': {
    title: 'raw_inference',
    body: '<p>模型原始推理输出，类型 <strong>bytes</strong>。体积大且不参与计算，在过滤阶段<strong>丢弃</strong>。</p>',
    fieldType: 'bytes',
    stage: 'source',
    pipeline: 'posture',
    transform: null,
    dropped: true,
    upstream: [],
    downstream: [],
    code: `<span class="cm">// 被过滤规则丢弃</span>`,
  },
  'src:o:device_info': {
    title: 'device_info',
    body: '<p>设备信息对象，类型 <strong>object</strong>。包含摄像头参数等元数据，在过滤阶段<strong>丢弃</strong>。</p>',
    fieldType: 'object',
    stage: 'source',
    pipeline: 'posture',
    transform: null,
    dropped: true,
    upstream: [],
    downstream: [],
    code: `<span class="cm">// 被过滤规则丢弃</span>`,
  },

  // ═══════════════════════════════════════════
  //  POSTURE PIPELINE — Filter
  // ═══════════════════════════════════════════
  'flt:o:frame_timestamp': {
    title: 'frame_timestamp (filtered)',
    body: '<p>经多维校验保留的时间戳。依次执行：<strong>置信度过滤</strong>（全部 33 关键点 visibility >= 0.85）、<strong>空值处理</strong>（landmarks 数组不为 null 且长度 == 33）、<strong>异常坐标检测</strong>（x/y/z 均在 [-1, 2] 归一化范围内）。原始 8,144 条 → 过滤后 6,947 条，剔除率 14.7%。</p>',
    fieldType: 'int64',
    stage: 'filter',
    pipeline: 'posture',
    transform: { type: 'passthrough', rule: 'landmarks[*].visibility >= 0.85 && landmarks not_null && len == 33 && coords in [-1,2]' },
    upstream: ['src:o:frame_timestamp'],
    downstream: ['map:o:ts'],
    code: `<span class="cm">// 三维姿态 - 数据过滤（多维校验）</span>
{
  <span class="str">"rules"</span>: [
    { <span class="str">"field"</span>: <span class="str">"landmarks"</span>, <span class="str">"op"</span>: <span class="str">"not_null"</span>, <span class="str">"desc"</span>: <span class="str">"空值处理"</span> },
    { <span class="str">"field"</span>: <span class="str">"landmarks"</span>, <span class="str">"op"</span>: <span class="str">"len"</span>, <span class="str">"value"</span>: <span class="num">33</span>, <span class="str">"desc"</span>: <span class="str">"关键点完整性校验"</span> },
    { <span class="str">"field"</span>: <span class="str">"landmarks[*].visibility"</span>, <span class="str">"op"</span>: <span class="str">">="</span>, <span class="str">"value"</span>: <span class="num">0.85</span>, <span class="str">"apply"</span>: <span class="str">"all"</span>, <span class="str">"desc"</span>: <span class="str">"置信度过滤"</span> },
    { <span class="str">"field"</span>: <span class="str">"landmarks[*].x"</span>, <span class="str">"op"</span>: <span class="str">"range"</span>, <span class="str">"min"</span>: <span class="num">-1</span>, <span class="str">"max"</span>: <span class="num">2</span>, <span class="str">"desc"</span>: <span class="str">"异常坐标检测"</span> },
    { <span class="str">"field"</span>: <span class="str">"landmarks[*].y"</span>, <span class="str">"op"</span>: <span class="str">"range"</span>, <span class="str">"min"</span>: <span class="num">-1</span>, <span class="str">"max"</span>: <span class="num">2</span>, <span class="str">"desc"</span>: <span class="str">"异常坐标检测"</span> },
    { <span class="str">"field"</span>: <span class="str">"landmarks[*].z"</span>, <span class="str">"op"</span>: <span class="str">"range"</span>, <span class="str">"min"</span>: <span class="num">-1</span>, <span class="str">"max"</span>: <span class="num">2</span>, <span class="str">"desc"</span>: <span class="str">"异常坐标检测"</span> }
  ],
  <span class="str">"null_strategy"</span>: <span class="str">"drop_row"</span>,
  <span class="str">"anomaly_strategy"</span>: <span class="str">"drop_row"</span>,
  <span class="str">"action"</span>: <span class="str">"drop_low_quality"</span>
}`,
  },
  'flt:o:landmarks': {
    title: 'landmarks[33] (filtered)',
    body: '<p>经多维校验后的关键点数据，合并 x/y/z 坐标与 visibility。通过<strong>空值剔除</strong>（null 帧）、<strong>关键点完整性校验</strong>（33 点齐全）、<strong>置信度过滤</strong>（visibility >= 0.85）、<strong>异常坐标过滤</strong>（归一化坐标越界）后，仅保留高质量关节点。</p>',
    fieldType: 'object',
    stage: 'filter',
    pipeline: 'posture',
    transform: { type: 'merge', rule: 'landmarks not_null && len == 33 && visibility >= 0.85 && coords in [-1,2]' },
    upstream: ['src:o:landmarks_xyz', 'src:o:landmarks_vis'],
    downstream: ['map:o:pose_data'],
    code: `<span class="cm">// 同上过滤规则</span>`,
  },

  // ═══════════════════════════════════════════
  //  POSTURE PIPELINE — Map
  // ═══════════════════════════════════════════
  'map:o:ts': {
    title: 'ts',
    body: '<p>由 <strong>frame_timestamp</strong> 重命名而来，与压力管线统一时间戳字段名。映射阶段执行<strong>帧率规整</strong>（统一到 30fps 基准）和<strong>重复时间戳合并</strong>。6,947 条 → 6,835 条，规整丢弃 112 条。</p>',
    fieldType: 'int64',
    stage: 'map',
    pipeline: 'posture',
    transform: { type: 'rename', from: 'frame_timestamp', to: 'ts', note: 'frame rate normalization, dedup on ts' },
    upstream: ['flt:o:frame_timestamp'],
    downstream: ['join:merged:ts'],
    code: `<span class="cm">// 三维姿态 - 字段映射</span>
{
  <span class="str">"mapping"</span>: {
    <span class="str">"frame_timestamp"</span>: <span class="str">"ts"</span>,
    <span class="str">"landmarks"</span>: <span class="str">"pose_data"</span>
  },
  <span class="str">"frame_rate_norm"</span>: { <span class="str">"target_fps"</span>: <span class="num">30</span>, <span class="str">"strategy"</span>: <span class="str">"nearest"</span> },
  <span class="str">"normalize"</span>: { <span class="str">"ts_unit"</span>: <span class="str">"ms"</span>, <span class="str">"coord_precision"</span>: <span class="num">6</span> }
}`,
  },
  'map:o:pose_data': {
    title: 'pose_data',
    body: '<p>由 <strong>landmarks</strong> 重命名而来，坐标精度 6 位小数。经帧率规整和时间戳去重后，作为关节夹角及步态参数计算的输入。</p>',
    fieldType: 'object',
    stage: 'map',
    pipeline: 'posture',
    transform: { type: 'rename', from: 'landmarks', to: 'pose_data' },
    upstream: ['flt:o:landmarks'],
    downstream: ['calc:o:joint_angle', 'calc:o:trunk_tilt', 'calc:o:head_forward_angle', 'calc:o:stride_angle', 'calc:o:step_frequency', 'calc:o:gait_speed', 'join:merged:pose_data'],
    code: `<span class="cm">// 同上映射规则</span>`,
  },

  // ═══════════════════════════════════════════
  //  POSTURE PIPELINE — Calc
  // ═══════════════════════════════════════════
  'calc:o:joint_angle': {
    title: 'joint_angle',
    body: '<p>关节夹角，由 <strong>pose_data</strong> 中相邻关键点向量计算，单位度。公式：acos(dot(v1,v2) / (|v1|*|v2|))。</p>',
    fieldType: 'float',
    stage: 'calc',
    pipeline: 'posture',
    transform: { type: 'derive', formula: 'acos(dot(v1, v2) / (|v1| * |v2|))', unit: 'degree' },
    upstream: ['map:o:pose_data'],
    downstream: ['join:merged:calc_fields'],
    code: `<span class="cm">// 三维姿态 - 字段计算</span>
{
  <span class="str">"field"</span>: <span class="str">"joint_angle"</span>,
  <span class="str">"formula"</span>: <span class="str">"acos(dot(v1, v2) / (|v1| * |v2|))"</span>,
  <span class="str">"unit"</span>: <span class="str">"degree"</span>
}`,
  },
  'calc:o:trunk_tilt': {
    title: 'trunk_tilt',
    body: '<p>躯干倾斜角，由肩部中点与髋部中点的相对位置计算。公式：atan2(shoulder_mid_x - hip_mid_x, shoulder_mid_y - hip_mid_y)。</p>',
    fieldType: 'float',
    stage: 'calc',
    pipeline: 'posture',
    transform: { type: 'derive', formula: 'atan2(shoulder_mid_x - hip_mid_x, shoulder_mid_y - hip_mid_y)' },
    upstream: ['map:o:pose_data'],
    downstream: ['join:merged:calc_fields'],
    code: `<span class="cm">// 躯干倾斜角</span>
{
  <span class="str">"field"</span>: <span class="str">"trunk_tilt"</span>,
  <span class="str">"formula"</span>: <span class="str">"atan2(shoulder_mid_x - hip_mid_x, ...)"</span>
}`,
  },
  'calc:o:head_forward_angle': {
    title: 'head_forward_angle',
    body: '<p>头部前倾角，由鼻尖、肩部中点、髋部中点三点确定的角度。用于评估头前伸姿势（"科技颈"风险指标）。</p>',
    fieldType: 'float',
    stage: 'calc',
    pipeline: 'posture',
    transform: { type: 'derive', formula: 'angle(nose, shoulder_mid, hip_mid)' },
    upstream: ['map:o:pose_data'],
    downstream: ['join:merged:calc_fields'],
    code: `<span class="cm">// 头部前倾角</span>
{
  <span class="str">"field"</span>: <span class="str">"head_forward_angle"</span>,
  <span class="str">"formula"</span>: <span class="str">"angle(nose, shoulder_mid, hip_mid)"</span>
}`,
  },
  'calc:o:stride_angle': {
    title: 'stride_angle',
    body: '<p>步幅角度，由左右髋关节与膝关节向量计算的<strong>步态展开角</strong>。公式：acos(dot(hip_knee_L, hip_knee_R) / (|hip_knee_L| * |hip_knee_R|))。反映步态宽度与稳定性。</p>',
    fieldType: 'float',
    stage: 'calc',
    pipeline: 'posture',
    transform: { type: 'derive', formula: 'acos(dot(hip_knee_L, hip_knee_R) / (|hip_knee_L| * |hip_knee_R|))', unit: 'degree' },
    upstream: ['map:o:pose_data'],
    downstream: ['join:merged:calc_fields'],
    code: `<span class="cm">// 步幅角度</span>
{
  <span class="str">"field"</span>: <span class="str">"stride_angle"</span>,
  <span class="str">"formula"</span>: <span class="str">"acos(dot(hip_knee_L, hip_knee_R) / ...)"</span>,
  <span class="str">"unit"</span>: <span class="str">"degree"</span>,
  <span class="str">"desc"</span>: <span class="str">"步态展开角，反映步宽"</span>
}`,
  },
  'calc:o:step_frequency': {
    title: 'step_frequency',
    body: '<p>步频，通过<strong>膝关节角度周期性变化</strong>检测步态周期，计算每分钟步数。公式：60 / mean(peak_to_peak_intervals)。单位 steps/min，正常范围 100–130。</p>',
    fieldType: 'float',
    stage: 'calc',
    pipeline: 'posture',
    transform: { type: 'derive', formula: '60 / mean(peak_to_peak_intervals(knee_angle_series))' },
    upstream: ['map:o:pose_data'],
    downstream: ['join:merged:calc_fields'],
    code: `<span class="cm">// 步频</span>
{
  <span class="str">"field"</span>: <span class="str">"step_frequency"</span>,
  <span class="str">"formula"</span>: <span class="str">"60 / mean(peak_intervals(knee_angle))"</span>,
  <span class="str">"unit"</span>: <span class="str">"steps/min"</span>,
  <span class="str">"normal_range"</span>: [<span class="num">100</span>, <span class="num">130</span>]
}`,
  },
  'calc:o:gait_speed': {
    title: 'gait_speed',
    body: '<p>步态速度估算，基于<strong>髋关节位移量</strong>与帧率推算。公式：delta(hip_center) * fps / frame_count。单位 m/s（经标定系数校正），正常步行约 1.2–1.5 m/s。</p>',
    fieldType: 'float',
    stage: 'calc',
    pipeline: 'posture',
    transform: { type: 'derive', formula: 'delta(hip_center) * fps / frame_count * calibration_factor' },
    upstream: ['map:o:pose_data'],
    downstream: ['join:merged:calc_fields'],
    code: `<span class="cm">// 步态速度估算</span>
{
  <span class="str">"field"</span>: <span class="str">"gait_speed"</span>,
  <span class="str">"formula"</span>: <span class="str">"delta(hip_center) * fps / n * k"</span>,
  <span class="str">"unit"</span>: <span class="str">"m/s"</span>,
  <span class="str">"calibration"</span>: <span class="str">"camera_distance_coefficient"</span>,
  <span class="str">"normal_range"</span>: [<span class="num">1.2</span>, <span class="num">1.5</span>]
}`,
  },

  // ═══════════════════════════════════════════
  //  JOIN
  // ═══════════════════════════════════════════
  'join:merged:ts': {
    title: 'ts (merged)',
    body: '<p>双流合并后的时间戳，作为关联主键。以<strong>统一毫秒级时间戳</strong>为基准，设置 <strong>50ms 时序匹配阈值</strong>，采用 nearest 策略进行对齐。左流 9,107 条 × 右流 6,835 条 → 匹配合并 6,218 条同步有效帧，匹配率 68.3%。仅保留双源同步有效帧，确保力姿数据严格一一对应。</p>',
    fieldType: 'int64',
    stage: 'join',
    pipeline: 'merged',
    transform: { type: 'merge', joinKey: 'ts', tolerance: '50ms', strategy: 'nearest', matchRate: '68.3%' },
    upstream: ['map:p:ts', 'map:o:ts'],
    downstream: ['out:db:t_fusion_health_dataset', 'out:api:latest', 'out:api:query'],
    code: `<span class="cm">// 双流 JOIN 融合 — 配置</span>
{
  <span class="str">"join_type"</span>: <span class="str">"inner"</span>,
  <span class="str">"join_key"</span>: <span class="str">"ts"</span>,
  <span class="str">"tolerance_ms"</span>: <span class="num">50</span>,
  <span class="str">"time_alignment"</span>: {
    <span class="str">"strategy"</span>: <span class="str">"nearest"</span>,
    <span class="str">"max_skew_ms"</span>: <span class="num">50</span>,
    <span class="str">"clock_drift_compensation"</span>: <span class="kw">true</span>
  },
  <span class="str">"match_quality"</span>: {
    <span class="str">"left_count"</span>: <span class="num">9107</span>,
    <span class="str">"right_count"</span>: <span class="num">6835</span>,
    <span class="str">"matched"</span>: <span class="num">6218</span>,
    <span class="str">"match_rate"</span>: <span class="str">"68.3%"</span>,
    <span class="str">"unmatched_left"</span>: <span class="num">2889</span>,
    <span class="str">"unmatched_right"</span>: <span class="num">617</span>
  }
}`,
  },
  'join:merged:pressure_data': {
    title: 'pressure_data (merged)',
    body: '<p>来自足底压力流的传感器数据数组，经过滤、映射后直接合并到融合数据集。</p>',
    fieldType: 'float[]',
    stage: 'join',
    pipeline: 'merged',
    transform: { type: 'carry', from: 'pressure stream' },
    upstream: ['map:p:pressure_data'],
    downstream: ['out:db:t_fusion_health_dataset'],
    code: `<span class="cm">// 来自压力流</span>`,
  },
  'join:merged:pose_data': {
    title: 'pose_data (merged)',
    body: '<p>来自三维姿态流的关键点数据对象，经置信度过滤和坐标规整后合并到融合数据集。</p>',
    fieldType: 'object',
    stage: 'join',
    pipeline: 'merged',
    transform: { type: 'carry', from: 'posture stream' },
    upstream: ['map:o:pose_data'],
    downstream: ['out:db:t_fusion_health_dataset'],
    code: `<span class="cm">// 来自姿态流</span>`,
  },
  'join:merged:match_quality': {
    title: 'match_quality',
    body: '<p>时序匹配质量分数，由 JOIN 过程自动计算。反映左右流时间戳对齐的精确度。</p>',
    fieldType: 'float',
    stage: 'join',
    pipeline: 'merged',
    transform: { type: 'derive', formula: 'computed during join alignment' },
    upstream: ['map:p:ts', 'map:o:ts'],
    downstream: ['out:db:t_fusion_health_dataset'],
    code: `<span class="cm">// 自动计算的匹配质量</span>`,
  },
  'join:merged:calc_fields': {
    title: 'calculated fields (9)',
    body: '<p>9 个衍生计算字段的集合。足底压力侧：center_of_gravity, cop_x, cop_y, <strong>pressure_index</strong>, <strong>lr_balance</strong>, <strong>peak_pressure</strong>。三维姿态侧：joint_angle, trunk_tilt, head_forward_angle, <strong>stride_angle</strong>, <strong>step_frequency</strong>, <strong>gait_speed</strong>。随 JOIN 一同合并，形成完整的力姿融合特征向量。</p>',
    fieldType: 'group',
    stage: 'join',
    pipeline: 'merged',
    transform: { type: 'carry', from: 'calc stages' },
    upstream: ['calc:p:center_of_gravity', 'calc:p:cop_x', 'calc:p:cop_y', 'calc:p:pressure_index', 'calc:p:lr_balance', 'calc:p:peak_pressure', 'calc:o:joint_angle', 'calc:o:trunk_tilt', 'calc:o:head_forward_angle', 'calc:o:stride_angle', 'calc:o:step_frequency', 'calc:o:gait_speed'],
    downstream: ['out:db:t_fusion_health_dataset'],
    code: `<span class="cm">// 所有计算字段随 JOIN 合并</span>`,
  },

  // ═══════════════════════════════════════════
  //  OUTPUT
  // ═══════════════════════════════════════════
  'out:db:t_fusion_health_dataset': {
    title: 't_fusion_health_dataset',
    body: '<p>融合健康数据表，持久化存储全部字段。以 <strong>ts</strong> 和 <strong>session_id</strong> 为索引，保留 365 天。</p>',
    fieldType: 'table',
    stage: 'output',
    pipeline: 'merged',
    transform: { type: 'persist', mode: 'append', batchSize: 1000, retention: '365d' },
    upstream: ['join:merged:ts', 'join:merged:pressure_data', 'join:merged:pose_data', 'join:merged:match_quality', 'join:merged:calc_fields'],
    downstream: [],
    code: `<span class="cm">// 数据入库</span>
{
  <span class="str">"target"</span>: <span class="str">"t_fusion_health_dataset"</span>,
  <span class="str">"write_mode"</span>: <span class="str">"append"</span>,
  <span class="str">"batch_size"</span>: <span class="num">1000</span>,
  <span class="str">"indexes"</span>: [<span class="str">"ts"</span>, <span class="str">"session_id"</span>],
  <span class="str">"retention_days"</span>: <span class="num">365</span>
}`,
  },
  'out:api:latest': {
    title: '/api/v1/latest',
    body: '<p>GET 接口，获取最新一条融合数据。为 AI 智能体提供实时体态健康数据调用支撑。</p>',
    fieldType: 'endpoint',
    stage: 'output',
    pipeline: 'merged',
    transform: { type: 'expose', method: 'GET', path: '/api/v1/latest' },
    upstream: ['join:merged:ts'],
    downstream: [],
    code: `<span class="cm">// API 接口发布</span>
{
  <span class="str">"method"</span>: <span class="str">"GET"</span>,
  <span class="str">"path"</span>: <span class="str">"/api/v1/latest"</span>,
  <span class="str">"desc"</span>: <span class="str">"获取最新融合数据"</span>
}`,
  },
  'out:api:query': {
    title: '/api/v1/query',
    body: '<p>POST 接口，按条件查询历史融合数据。支持按时间范围、session 等维度筛选。</p>',
    fieldType: 'endpoint',
    stage: 'output',
    pipeline: 'merged',
    transform: { type: 'expose', method: 'POST', path: '/api/v1/query' },
    upstream: ['join:merged:ts'],
    downstream: [],
    code: `<span class="cm">// API 接口发布</span>
{
  <span class="str">"method"</span>: <span class="str">"POST"</span>,
  <span class="str">"path"</span>: <span class="str">"/api/v1/query"</span>,
  <span class="str">"desc"</span>: <span class="str">"按条件查询历史数据"</span>
}`,
  },
};

export default fieldDetails;

// ─── Process-Step Details (for ETL pipeline DetailPanel) ───
export const processDetails = {
  'pressure-input': {
    title: '足底压力数据 — API 输入源',
    body: '<p>通过 RESTful API 接入<strong>足底压力传感器</strong>原始数据流，包含 18 个压力区域实时采样值。</p>',
    blocks: [
      {
        type: 'output',
        icon: 'P',
        name: 'API 输入配置',
        desc: '足底压力数据实时接入',
        code: `<span class="cm">// 足底压力 API 输入</span>
{
  <span class="str">"source_type"</span>: <span class="str">"rest_api"</span>,
  <span class="str">"endpoint"</span>: <span class="str">"/api/pressure/stream"</span>,
  <span class="str">"format"</span>: <span class="str">"json"</span>,
  <span class="str">"fields"</span>: [
    <span class="str">"timestamp_ms"</span>,
    <span class="str">"sensor_values[18]"</span>,
    <span class="str">"valid_frame"</span>
  ]
}`,
      },
    ],
  },
  'pressure-filter': {
    title: '足底压力 — 数据过滤',
    body: '<p>执行<strong>多维数据质量校验</strong>：剔除无效帧（valid_frame != true）、空值处理（sensor_values 为 null / NaN）、数组完整性校验（长度必须为 18）、异常值检测（传感器读数超出 0–4096 ADC 量程）。10,752 条 → 9,238 条，剔除 1,514 条脏数据（14.1%）。</p>',
    blocks: [
      {
        type: 'filter',
        icon: 'F',
        name: '数据过滤控件',
        desc: '无效帧 / 空值处理 / 异常值检测',
        code: `<span class="cm">// 足底压力 - 数据过滤（多维校验）</span>
{
  <span class="str">"source"</span>: <span class="str">"pressure"</span>,
  <span class="str">"input_count"</span>: <span class="num">10752</span>,
  <span class="str">"rules"</span>: [
    { <span class="str">"field"</span>: <span class="str">"valid_frame"</span>, <span class="str">"op"</span>: <span class="str">"=="</span>, <span class="str">"value"</span>: <span class="kw">true</span>, <span class="str">"desc"</span>: <span class="str">"剔除无效帧"</span> },
    { <span class="str">"field"</span>: <span class="str">"sensor_values"</span>, <span class="str">"op"</span>: <span class="str">"not_null"</span>, <span class="str">"desc"</span>: <span class="str">"空值处理"</span> },
    { <span class="str">"field"</span>: <span class="str">"sensor_values"</span>, <span class="str">"op"</span>: <span class="str">"len"</span>, <span class="str">"value"</span>: <span class="num">18</span>, <span class="str">"desc"</span>: <span class="str">"数组完整性校验"</span> },
    { <span class="str">"field"</span>: <span class="str">"sensor_values[*]"</span>, <span class="str">"op"</span>: <span class="str">"range"</span>, <span class="str">"min"</span>: <span class="num">0</span>, <span class="str">"max"</span>: <span class="num">4096</span>, <span class="str">"desc"</span>: <span class="str">"异常值检测（量程越界）"</span> }
  ],
  <span class="str">"null_strategy"</span>: <span class="str">"drop_row"</span>,
  <span class="str">"anomaly_strategy"</span>: <span class="str">"drop_row"</span>,
  <span class="str">"output_count"</span>: <span class="num">9238</span>,
  <span class="str">"action"</span>: <span class="str">"drop_invalid"</span>
}`,
      },
    ],
  },
  'pressure-map': {
    title: '足底压力 — 字段映射转换',
    body: '<p>统一字段格式，规整参数，<strong>剔除冗余字段</strong>，实现数据结构化标准化。映射阶段额外执行<strong>重复时间戳合并</strong>（同一毫秒内多帧传感器值取均值），9,238 条 → 9,107 条。</p>',
    blocks: [
      {
        type: 'transform',
        icon: 'T',
        name: '字段映射转换控件',
        desc: '统一字段格式 / 重复帧合并',
        code: `<span class="cm">// 足底压力 - 字段映射</span>
{
  <span class="str">"mapping"</span>: {
    <span class="str">"timestamp_ms"</span>: <span class="str">"ts"</span>,
    <span class="str">"sensor_values"</span>: <span class="str">"pressure_data"</span>
  },
  <span class="str">"drop"</span>: [<span class="str">"raw_buffer"</span>, <span class="str">"crc"</span>, <span class="str">"device_id"</span>],
  <span class="str">"dedup"</span>: { <span class="str">"key"</span>: <span class="str">"ts"</span>, <span class="str">"strategy"</span>: <span class="str">"mean"</span>, <span class="str">"dropped"</span>: <span class="num">131</span> },
  <span class="str">"normalize"</span>: { <span class="str">"ts_unit"</span>: <span class="str">"ms"</span>, <span class="str">"precision"</span>: <span class="num">4</span> }
}`,
      },
    ],
  },
  'pressure-calc': {
    title: '足底压力 — 字段计算',
    body: '<p>基于传感器阵列数据，校正<strong>重心</strong>等核心参数误差，同时计算<strong>压强分布指数</strong>、<strong>左右平衡比</strong>、<strong>峰值压强</strong>等衍生指标，共 6 个计算字段，提升数据维度与精度。</p>',
    blocks: [
      {
        type: 'calc',
        icon: 'C',
        name: '字段计算控件',
        desc: '重心 / COP / 压强分布 / 平衡比 / 峰值',
        code: `<span class="cm">// 足底压力 - 字段计算（6 项）</span>
{
  <span class="str">"calculations"</span>: [
    {
      <span class="str">"field"</span>: <span class="str">"center_of_gravity"</span>,
      <span class="str">"formula"</span>: <span class="str">"weighted_avg(pressure_data, sensor_positions)"</span>,
      <span class="str">"precision"</span>: <span class="num">2</span>
    },
    {
      <span class="str">"field"</span>: <span class="str">"cop_x"</span>,
      <span class="str">"formula"</span>: <span class="str">"sum(p_i * x_i) / sum(p_i)"</span>,
      <span class="str">"desc"</span>: <span class="str">"压力中心 X（左右分布）"</span>
    },
    {
      <span class="str">"field"</span>: <span class="str">"cop_y"</span>,
      <span class="str">"formula"</span>: <span class="str">"sum(p_i * y_i) / sum(p_i)"</span>,
      <span class="str">"desc"</span>: <span class="str">"压力中心 Y（前后分布）"</span>
    },
    {
      <span class="str">"field"</span>: <span class="str">"pressure_index"</span>,
      <span class="str">"formula"</span>: <span class="str">"std(pressure_data) / mean(pressure_data)"</span>,
      <span class="str">"precision"</span>: <span class="num">4</span>,
      <span class="str">"desc"</span>: <span class="str">"压强分布指数（变异系数）"</span>
    },
    {
      <span class="str">"field"</span>: <span class="str">"lr_balance"</span>,
      <span class="str">"formula"</span>: <span class="str">"sum(left_half) / sum(all)"</span>,
      <span class="str">"ideal"</span>: <span class="num">0.5</span>,
      <span class="str">"desc"</span>: <span class="str">"左右脚压力平衡比"</span>
    },
    {
      <span class="str">"field"</span>: <span class="str">"peak_pressure"</span>,
      <span class="str">"formula"</span>: <span class="str">"max(pressure_data)"</span>,
      <span class="str">"desc"</span>: <span class="str">"峰值压强（最大传感器读数）"</span>
    }
  ]
}`,
      },
    ],
  },
  'posture-input': {
    title: '三维姿态数据 — API 输入源',
    body: '<p>通过 RESTful API 接入<strong>三维姿态估计</strong>原始数据流，包含 33 个关键点三维坐标与置信度。</p>',
    blocks: [
      {
        type: 'output',
        icon: 'P',
        name: 'API 输入配置',
        desc: '三维姿态数据实时接入',
        code: `<span class="cm">// 三维姿态 API 输入</span>
{
  <span class="str">"source_type"</span>: <span class="str">"rest_api"</span>,
  <span class="str">"endpoint"</span>: <span class="str">"/api/posture/stream"</span>,
  <span class="str">"format"</span>: <span class="str">"json"</span>,
  <span class="str">"fields"</span>: [
    <span class="str">"frame_timestamp"</span>,
    <span class="str">"landmarks[33].x"</span>,
    <span class="str">"landmarks[33].y"</span>,
    <span class="str">"landmarks[33].z"</span>,
    <span class="str">"landmarks[33].visibility"</span>
  ]
}`,
      },
    ],
  },
  'posture-filter': {
    title: '三维姿态 — 数据过滤',
    body: '<p>执行<strong>多维数据质量校验</strong>：空值处理（landmarks 为 null 帧）、关键点完整性校验（33 点齐全）、置信度过滤（全部关键点 visibility >= 0.85）、异常坐标检测（x/y/z 超出 [-1, 2] 归一化范围）。8,144 条 → 6,947 条，剔除 1,197 条低质量帧（14.7%）。</p>',
    blocks: [
      {
        type: 'filter',
        icon: 'F',
        name: '数据过滤控件',
        desc: '置信度 / 空值处理 / 异常坐标检测',
        code: `<span class="cm">// 三维姿态 - 数据过滤（多维校验）</span>
{
  <span class="str">"source"</span>: <span class="str">"posture"</span>,
  <span class="str">"input_count"</span>: <span class="num">8144</span>,
  <span class="str">"rules"</span>: [
    { <span class="str">"field"</span>: <span class="str">"landmarks"</span>, <span class="str">"op"</span>: <span class="str">"not_null"</span>, <span class="str">"desc"</span>: <span class="str">"空值处理"</span> },
    { <span class="str">"field"</span>: <span class="str">"landmarks"</span>, <span class="str">"op"</span>: <span class="str">"len"</span>, <span class="str">"value"</span>: <span class="num">33</span>, <span class="str">"desc"</span>: <span class="str">"关键点完整性校验"</span> },
    { <span class="str">"field"</span>: <span class="str">"landmarks[*].visibility"</span>, <span class="str">"op"</span>: <span class="str">">="</span>, <span class="str">"value"</span>: <span class="num">0.85</span>, <span class="str">"apply"</span>: <span class="str">"all"</span>, <span class="str">"desc"</span>: <span class="str">"置信度过滤"</span> },
    { <span class="str">"field"</span>: <span class="str">"landmarks[*].x"</span>, <span class="str">"op"</span>: <span class="str">"range"</span>, <span class="str">"min"</span>: <span class="num">-1</span>, <span class="str">"max"</span>: <span class="num">2</span>, <span class="str">"desc"</span>: <span class="str">"异常坐标检测"</span> },
    { <span class="str">"field"</span>: <span class="str">"landmarks[*].y"</span>, <span class="str">"op"</span>: <span class="str">"range"</span>, <span class="str">"min"</span>: <span class="num">-1</span>, <span class="str">"max"</span>: <span class="num">2</span>, <span class="str">"desc"</span>: <span class="str">"异常坐标检测"</span> },
    { <span class="str">"field"</span>: <span class="str">"landmarks[*].z"</span>, <span class="str">"op"</span>: <span class="str">"range"</span>, <span class="str">"min"</span>: <span class="num">-1</span>, <span class="str">"max"</span>: <span class="num">2</span>, <span class="str">"desc"</span>: <span class="str">"异常坐标检测"</span> }
  ],
  <span class="str">"null_strategy"</span>: <span class="str">"drop_row"</span>,
  <span class="str">"anomaly_strategy"</span>: <span class="str">"drop_row"</span>,
  <span class="str">"output_count"</span>: <span class="num">6947</span>,
  <span class="str">"action"</span>: <span class="str">"drop_low_quality"</span>
}`,
      },
    ],
  },
  'posture-map': {
    title: '三维姿态 — 字段映射转换',
    body: '<p>统一字段格式，<strong>规整坐标参数</strong>，剔除模型推理冗余信息。映射阶段额外执行<strong>帧率规整</strong>（统一到 30fps 基准）和<strong>重复时间戳合并</strong>，6,947 条 → 6,835 条。</p>',
    blocks: [
      {
        type: 'transform',
        icon: 'T',
        name: '字段映射转换控件',
        desc: '规整坐标参数 / 帧率规整',
        code: `<span class="cm">// 三维姿态 - 字段映射</span>
{
  <span class="str">"mapping"</span>: {
    <span class="str">"frame_timestamp"</span>: <span class="str">"ts"</span>,
    <span class="str">"landmarks"</span>: <span class="str">"pose_data"</span>
  },
  <span class="str">"drop"</span>: [<span class="str">"model_version"</span>, <span class="str">"raw_inference"</span>, <span class="str">"device_info"</span>],
  <span class="str">"frame_rate_norm"</span>: { <span class="str">"target_fps"</span>: <span class="num">30</span>, <span class="str">"strategy"</span>: <span class="str">"nearest"</span>, <span class="str">"dropped"</span>: <span class="num">112</span> },
  <span class="str">"normalize"</span>: { <span class="str">"ts_unit"</span>: <span class="str">"ms"</span>, <span class="str">"coord_precision"</span>: <span class="num">6</span> }
}`,
      },
    ],
  },
  'posture-calc': {
    title: '三维姿态 — 字段计算',
    body: '<p>基于关键点坐标<strong>计算关节夹角</strong>、躯干倾斜等姿态指标，同时计算<strong>步幅角度</strong>、<strong>步频</strong>、<strong>步态速度</strong>等步态参数，共 6 个计算字段，全面量化运动姿态特征。</p>',
    blocks: [
      {
        type: 'calc',
        icon: 'C',
        name: '字段计算控件',
        desc: '关节夹角 / 躯干倾斜 / 步态参数',
        code: `<span class="cm">// 三维姿态 - 字段计算（6 项）</span>
{
  <span class="str">"calculations"</span>: [
    {
      <span class="str">"field"</span>: <span class="str">"joint_angle"</span>,
      <span class="str">"formula"</span>: <span class="str">"acos(dot(v1, v2) / (|v1| * |v2|))"</span>,
      <span class="str">"unit"</span>: <span class="str">"degree"</span>
    },
    {
      <span class="str">"field"</span>: <span class="str">"trunk_tilt"</span>,
      <span class="str">"formula"</span>: <span class="str">"atan2(shoulder_mid_x - hip_mid_x, ...)"</span>,
      <span class="str">"desc"</span>: <span class="str">"躯干倾斜角"</span>
    },
    {
      <span class="str">"field"</span>: <span class="str">"head_forward_angle"</span>,
      <span class="str">"formula"</span>: <span class="str">"angle(nose, shoulder_mid, hip_mid)"</span>,
      <span class="str">"desc"</span>: <span class="str">"头部前倾角"</span>
    },
    {
      <span class="str">"field"</span>: <span class="str">"stride_angle"</span>,
      <span class="str">"formula"</span>: <span class="str">"acos(dot(hip_knee_L, hip_knee_R) / ...)"</span>,
      <span class="str">"unit"</span>: <span class="str">"degree"</span>,
      <span class="str">"desc"</span>: <span class="str">"步幅角度（步态宽度）"</span>
    },
    {
      <span class="str">"field"</span>: <span class="str">"step_frequency"</span>,
      <span class="str">"formula"</span>: <span class="str">"60 / mean(peak_intervals(knee_angle))"</span>,
      <span class="str">"unit"</span>: <span class="str">"steps/min"</span>,
      <span class="str">"desc"</span>: <span class="str">"步频"</span>
    },
    {
      <span class="str">"field"</span>: <span class="str">"gait_speed"</span>,
      <span class="str">"formula"</span>: <span class="str">"delta(hip_center) * fps / n * k"</span>,
      <span class="str">"unit"</span>: <span class="str">"m/s"</span>,
      <span class="str">"desc"</span>: <span class="str">"步态速度估算"</span>
    }
  ]
}`,
      },
    ],
  },
  join: {
    title: '双流 JOIN 多源时序精准融合',
    body: '<p>以统一<strong>毫秒级时间戳</strong>为关联主键，设置 <strong>50ms 时序匹配阈值</strong>，采用 nearest 最近邻策略进行双流对齐。左流（足底压力）9,107 帧 × 右流（三维姿态）6,835 帧 → 匹配合并 <strong>6,218 帧</strong>同步有效数据，匹配率 68.3%。未匹配帧中，左流独有 2,889 帧（压力采集频率高于姿态）、右流独有 617 帧。匹配质量分数随每帧输出，用于下游数据可信度评估。</p>',
    blocks: [
      {
        type: 'join',
        icon: 'J',
        name: '双流 JOIN 融合控件',
        desc: '50ms 时序精准对齐 · 6,218 帧同步',
        code: `<span class="cm">// 双流 JOIN 融合 - 配置</span>
{
  <span class="str">"join_type"</span>: <span class="str">"inner"</span>,
  <span class="str">"left_stream"</span>: <span class="str">"pressure_cleaned"</span>,
  <span class="str">"right_stream"</span>: <span class="str">"posture_cleaned"</span>,
  <span class="str">"join_key"</span>: <span class="str">"ts"</span>,
  <span class="str">"tolerance_ms"</span>: <span class="num">50</span>,
  <span class="str">"time_alignment"</span>: {
    <span class="str">"strategy"</span>: <span class="str">"nearest"</span>,
    <span class="str">"max_skew_ms"</span>: <span class="num">50</span>,
    <span class="str">"clock_drift_compensation"</span>: <span class="kw">true</span>
  },
  <span class="str">"match_statistics"</span>: {
    <span class="str">"left_input"</span>: <span class="num">9107</span>,
    <span class="str">"right_input"</span>: <span class="num">6835</span>,
    <span class="str">"matched_output"</span>: <span class="num">6218</span>,
    <span class="str">"match_rate"</span>: <span class="str">"68.3%"</span>,
    <span class="str">"unmatched_left"</span>: <span class="num">2889</span>,
    <span class="str">"unmatched_right"</span>: <span class="num">617</span>,
    <span class="str">"avg_skew_ms"</span>: <span class="num">12.4</span>,
    <span class="str">"p99_skew_ms"</span>: <span class="num">43.7</span>
  },
  <span class="str">"output_schema"</span>: {
    <span class="str">"ts"</span>: <span class="str">"merged_timestamp"</span>,
    <span class="str">"pressure_data"</span>: <span class="str">"from left stream"</span>,
    <span class="str">"pose_data"</span>: <span class="str">"from right stream"</span>,
    <span class="str">"calc_fields"</span>: <span class="str">"9 derived fields"</span>,
    <span class="str">"match_quality"</span>: <span class="str">"computed per frame"</span>
  }
}`,
      },
    ],
  },
  db: {
    title: '数据入库',
    body: '<p>将融合后的 <strong>6,218 条</strong>高质量数据<strong>持久化入库</strong>，沉淀为标准化体态健康数据集。与接口发布并行执行。</p>',
    blocks: [
      {
        type: 'output',
        icon: 'D',
        name: '数据入库控件',
        desc: '标准化持久化存储 · 6,218 条',
        code: `<span class="cm">// 数据入库 - 配置</span>
{
  <span class="str">"target"</span>: <span class="str">"t_fusion_health_dataset"</span>,
  <span class="str">"write_mode"</span>: <span class="str">"append"</span>,
  <span class="str">"batch_size"</span>: <span class="num">1000</span>,
  <span class="str">"record_count"</span>: <span class="num">6218</span>,
  <span class="str">"indexes"</span>: [<span class="str">"ts"</span>, <span class="str">"session_id"</span>],
  <span class="str">"retention_days"</span>: <span class="num">365</span>
}`,
      },
    ],
  },
  api: {
    title: '接口发布',
    body: '<p>对外发布标准化 RESTful API，为 AI 智能体提供<strong>稳定数据调用支撑</strong>。与数据入库<strong>并行执行</strong>，确保数据持久化与接口可用性同步就绪。</p>',
    blocks: [
      {
        type: 'output',
        icon: 'A',
        name: 'API 接口发布控件',
        desc: 'RESTful API 发布 · 与入库并行',
        code: `<span class="cm">// API 接口发布 - 配置</span>
{
  <span class="str">"api_name"</span>: <span class="str">"fusion-health-api"</span>,
  <span class="str">"version"</span>: <span class="str">"v1"</span>,
  <span class="str">"record_count"</span>: <span class="num">6218</span>,
  <span class="str">"execution"</span>: <span class="str">"parallel_with_db"</span>,
  <span class="str">"endpoints"</span>: [
    {
      <span class="str">"method"</span>: <span class="str">"GET"</span>,
      <span class="str">"path"</span>: <span class="str">"/api/v1/latest"</span>,
      <span class="str">"desc"</span>: <span class="str">"获取最新融合数据"</span>
    },
    {
      <span class="str">"method"</span>: <span class="str">"POST"</span>,
      <span class="str">"path"</span>: <span class="str">"/api/v1/query"</span>,
      <span class="str">"desc"</span>: <span class="str">"按条件查询历史数据"</span>
    }
  ],
  <span class="str">"auth"</span>: <span class="str">"api_key"</span>
}`,
      },
    ],
  },
};
