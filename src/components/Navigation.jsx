import { Layout, Menu, Button, Space, Tag, Tooltip } from 'antd';
import {
  DashboardOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  BulbOutlined,
  BulbFilled,
} from '@ant-design/icons';

const { Header } = Layout;

const navItems = [
  {
    key: 'monitor',
    label: '数据监控',
    icon: <DashboardOutlined />,
    desc: '实时数据采集与监控',
  },
  {
    key: 'workflow',
    label: '工作流编排',
    icon: <ThunderboltOutlined />,
    desc: '可视化工作流设计',
  },
  {
    key: 'pipeline',
    label: '数据治理',
    icon: <SyncOutlined />,
    desc: 'ETL 流水线执行',
  },
];

const statusColors = {
  idle: 'default',
  running: 'processing',
  completed: 'success',
  error: 'error',
};

const statusLabels = {
  idle: '空闲',
  running: '运行中',
  completed: '已完成',
  error: '错误',
};

export default function Navigation({
  currentPage,
  onPageChange,
  workflowStatus,
  theme,
  onToggleTheme,
}) {
  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: theme === 'dark' ? '#1e293b' : '#ffffff',
        borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        height: 56,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Menu
          mode="horizontal"
          selectedKeys={[currentPage]}
          items={navItems.map((item) => ({
            key: item.key,
            icon: item.icon,
            label: (
              <Tooltip title={item.desc} placement="bottom">
                <span>{item.label}</span>
              </Tooltip>
            ),
          }))}
          onClick={({ key }) => onPageChange(key)}
          style={{
            flex: 1,
            minWidth: 0,
            borderBottom: 'none',
            background: 'transparent',
          }}
        />
      </div>

      <Space size={12}>
        <Tag
          color={statusColors[workflowStatus]}
          style={{ margin: 0, borderRadius: 4 }}
        >
          {statusLabels[workflowStatus]}
        </Tag>
        <Button
          type="text"
          icon={theme === 'dark' ? <BulbFilled /> : <BulbOutlined />}
          onClick={onToggleTheme}
          style={{ color: theme === 'dark' ? '#fbbf24' : '#6b7280' }}
        />
      </Space>
    </Header>
  );
}
