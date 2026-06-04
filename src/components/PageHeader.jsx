import { Layout, Button, Space, Typography, Tooltip } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Text } = Typography;

// 统一的二级头部组件
export default function PageHeader({
  title,
  titleSuffix,
  onBack,
  extra,
  children,
  style,
}) {
  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        height: 56,
        lineHeight: '56px',
        ...style,
      }}
    >
      {/* 左侧：返回按钮 + 标题 */}
      <Space size={12}>
        {onBack && (
          <Tooltip title="返回">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={onBack}
              style={{ color: 'var(--text)' }}
            />
          </Tooltip>
        )}
        <Text
          strong
          style={{
            fontSize: 16,
            color: 'var(--text)',
            letterSpacing: '-0.3px',
          }}
        >
          {title}
          {titleSuffix && (
            <span style={{ fontWeight: 400, color: 'var(--muted)' }}>
              {titleSuffix}
            </span>
          )}
        </Text>
      </Space>

      {/* 右侧：操作按钮 */}
      <Space size={8}>
        {extra}
        {children}
      </Space>
    </Header>
  );
}

// 预设的头部样式变体
export function MonitorHeader({ onBack, extra, children }) {
  return (
    <PageHeader
      title="数据调试中心"
      onBack={onBack}
      extra={extra}
    >
      {children}
    </PageHeader>
  );
}

export function WorkflowHeader({ onBack, nodeCount, edgeCount, extra, children }) {
  return (
    <PageHeader
      title="工作流"
      titleSuffix="编辑器"
      onBack={onBack}
      extra={
        <Space size={8}>
          {nodeCount !== undefined && edgeCount !== undefined && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              节点: {nodeCount} | 连线: {edgeCount}
            </Text>
          )}
          {extra}
        </Space>
      }
    >
      {children}
    </PageHeader>
  );
}

export function PipelineHeader({ onBack, extra, children }) {
  return (
    <PageHeader
      title="数据治理流水线"
      onBack={onBack}
      extra={extra}
    >
      {children}
    </PageHeader>
  );
}
