export const pipelineRows = [
  {
    id: 'pressure',
    stream: 'a',
    label: '足底压力',
    color: '#6c8cff',
    nodes: [
      { id: 'pressure-input', label: '足底压力数据', sub: 'API 输入源', tag: '源', inputCount: 10752, outputCount: 10752 },
      { id: 'pressure-filter', label: '数据过滤', sub: '无效帧 / 空值 / 异常值', inputCount: 10752, outputCount: 9238 },
      { id: 'pressure-map', label: '字段映射转换', sub: '标准化格式', inputCount: 9238, outputCount: 9107 },
      { id: 'pressure-calc', label: '字段计算', sub: '重心 / COP / 压强分布', inputCount: 9107, outputCount: 9107 },
    ],
  },
  {
    id: 'posture',
    stream: 'b',
    label: '三维姿态',
    color: '#22d3ee',
    nodes: [
      { id: 'posture-input', label: '三维姿态数据', sub: 'API 输入源', tag: '源', inputCount: 8144, outputCount: 8144 },
      { id: 'posture-filter', label: '数据过滤', sub: '置信度 / 空值 / 异常坐标', inputCount: 8144, outputCount: 6947 },
      { id: 'posture-map', label: '字段映射转换', sub: '规整参数', inputCount: 6947, outputCount: 6835 },
      { id: 'posture-calc', label: '字段计算', sub: '关节夹角 / 步态参数', inputCount: 6835, outputCount: 6835 },
    ],
  },
];

export const mergedNodes = [
  { id: 'join', label: '双流 JOIN 融合', sub: '50ms 时序精准对齐', tag: '核心', stream: 'merge', inputCount: 9107, outputCount: 6218 },
  { id: 'db', label: '数据入库', sub: '标准化持久化', stream: 'out', inputCount: 6218, outputCount: 6218 },
  { id: 'api', label: '接口发布', sub: 'RESTful API', stream: 'out', inputCount: 6218, outputCount: 6218 },
];
