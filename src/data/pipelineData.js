export const pipelineRows = [
  {
    id: 'pressure',
    stream: 'a',
    label: '足底压力',
    color: 'var(--accent)',
    nodes: [
      {
        id: 'pressure-input',
        label: '足底压力数据',
        sub: 'API 实时接入源',
        tag: '源',
        inputCount: 10752,
        outputCount: 10752,
      },
      {
        id: 'pressure-filter',
        label: '数据清洗',
        sub: '无效帧/空值/异常值 · 去重 · 噪声平滑',
        inputCount: 10752,
        outputCount: 9120,
      },
      {
        id: 'pressure-map',
        label: '字段标准化',
        sub: '字段映射 · 格式归一 · Z-Score',
        inputCount: 9120,
        outputCount: 9107,
      },
    ],
  },
  {
    id: 'posture',
    stream: 'b',
    label: '三维姿态',
    color: 'var(--cyan)',
    nodes: [
      {
        id: 'posture-input',
        label: '三维姿态数据',
        sub: 'API 实时接入源',
        tag: '源',
        inputCount: 8144,
        outputCount: 8144,
      },
      {
        id: 'posture-filter',
        label: '数据清洗',
        sub: '置信度/空值/异常坐标 · 去重 · 卡尔曼平滑',
        inputCount: 8144,
        outputCount: 6892,
      },
      {
        id: 'posture-map',
        label: '字段标准化',
        sub: '坐标系转换 · 骨架归一 · 尺度对齐',
        inputCount: 6892,
        outputCount: 6835,
      },
    ],
  },
];

export const mergedNodes = [
  {
    id: 'join',
    label: '双流 JOIN 融合',
    sub: '毫秒级时间戳时序精准对齐',
    tag: '核心',
    stream: 'merge',
    inputCount: 15942,
    outputCount: 6218,
  },
  {
    id: 'quality',
    label: '融合质量检查',
    sub: '关联完整性 / 一致性校验',
    stream: 'merge',
    inputCount: 6218,
    outputCount: 3082,
  },
  {
    id: 'db',
    label: '数据入库',
    sub: '标准化持久化',
    stream: 'out',
    inputCount: 3082,
    outputCount: 3082,
  },
  {
    id: 'api',
    label: '接口发布',
    sub: 'RESTful API',
    stream: 'out',
    inputCount: 3082,
    outputCount: 3082,
  },
];
