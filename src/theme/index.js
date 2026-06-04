import { theme } from 'antd';

// 亮色主题
export const lightTheme = {
  algorithm: theme.defaultAlgorithm,
  token: {
    // 主色调
    colorPrimary: '#6c8cff',
    colorSuccess: '#34d399',
    colorWarning: '#fb923c',
    colorError: '#f87171',
    colorInfo: '#22d3ee',

    // 中性色
    colorText: '#1f2937',
    colorTextSecondary: '#6b7280',
    colorTextTertiary: '#9ca3af',
    colorBg: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#f9fafb',
    colorBgLayout: '#f3f4f6',
    colorBorder: '#e5e7eb',
    colorBorderSecondary: '#f3f4f6',

    // 圆角
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,

    // 字体
    fontFamily: "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,

    // 间距
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,

    // 控件高度
    controlHeight: 36,
    controlHeightLG: 44,
    controlHeightSM: 28,

    // 阴影
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',

    // 动画
    motionDurationSlow: '0.3s',
    motionDurationMid: '0.2s',
    motionDurationFast: '0.1s',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Card: {
      borderRadiusLG: 12,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Drawer: {
      borderRadiusLG: 12,
    },
  },
};

// 暗色主题
export const darkTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    // 主色调（与亮色模式一致）
    colorPrimary: '#6c8cff',
    colorSuccess: '#34d399',
    colorWarning: '#fb923c',
    colorError: '#f87171',
    colorInfo: '#22d3ee',

    // 中性色（深色模式）
    colorText: '#f9fafb',
    colorTextSecondary: '#9ca3af',
    colorTextTertiary: '#6b7280',
    colorBg: '#0f172a',
    colorBgContainer: '#1e293b',
    colorBgElevated: '#334155',
    colorBgLayout: '#0f172a',
    colorBorder: '#374151',
    colorBorderSecondary: '#1e293b',

    // 圆角（与亮色模式一致）
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,

    // 字体（与亮色模式一致）
    fontFamily: "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif",
    fontSize: 14,
    fontSizeHeading1: 28,
    fontSizeHeading2: 24,
    fontSizeHeading3: 20,
    fontSizeHeading4: 16,
    fontSizeHeading5: 14,

    // 间距（与亮色模式一致）
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,

    // 控件高度（与亮色模式一致）
    controlHeight: 36,
    controlHeightLG: 44,
    controlHeightSM: 28,

    // 阴影（深色模式）
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 1px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.4), 0 3px 6px -4px rgba(0, 0, 0, 0.5), 0 9px 28px 8px rgba(0, 0, 0, 0.3)',

    // 动画（与亮色模式一致）
    motionDurationSlow: '0.3s',
    motionDurationMid: '0.2s',
    motionDurationFast: '0.1s',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Card: {
      borderRadiusLG: 12,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Modal: {
      borderRadiusLG: 12,
    },
    Drawer: {
      borderRadiusLG: 12,
    },
  },
};

// 节点颜色配置
export const nodeColors = {
  start: '#34d399',
  end: '#f87171',
  input: '#22d3ee',
  output: '#a78bfa',
  process: '#6c8cff',
  condition: '#fb923c',
  transform: '#f472b6',
  merge: '#a78bfa',
  code: '#a78bfa',
  sql: '#22d3ee',
  http: '#6c8cff',
  cache: '#a78bfa',
  log: '#6b7280',
  filter: '#22d3ee',
  aggregate: '#fb923c',
  sort: '#f472b6',
  sample: '#34d399',
  validate: '#f87171',
};

export default {
  lightTheme,
  darkTheme,
  nodeColors,
};
