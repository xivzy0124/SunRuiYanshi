import { useEffect, useRef } from 'react';
import { Menu, Typography } from 'antd';
import { nodeColors } from '../theme';

const { Text } = Typography;

export default function ContextMenu({ x, y, nodeTypes, onCreateNode, onClose }) {
  const menuRef = useRef(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) {
        return;
      }
      onClose();
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [onClose]);

  // 计算菜单位置（确保不超出视口）
  const menuStyle = {
    left: `${Math.min(x, window.innerWidth - 200)}px`,
    top: `${Math.min(y, window.innerHeight - 300)}px`,
  };

  // 构建菜单项
  const menuItems = [
    {
      key: 'basic',
      label: <Text type="secondary" style={{ fontSize: 11 }}>基础节点</Text>,
      type: 'group',
      children: [
        {
          key: 'start',
          label: '开始节点',
          icon: nodeTypes.start.icon,
          onClick: () => onCreateNode('start'),
        },
        {
          key: 'end',
          label: '结束节点',
          icon: nodeTypes.end.icon,
          onClick: () => onCreateNode('end'),
        },
      ],
    },
    {
      key: 'data',
      label: <Text type="secondary" style={{ fontSize: 11 }}>数据节点</Text>,
      type: 'group',
      children: [
        {
          key: 'input',
          label: '输入节点',
          icon: nodeTypes.input.icon,
          onClick: () => onCreateNode('input'),
        },
        {
          key: 'output',
          label: '输出节点',
          icon: nodeTypes.output.icon,
          onClick: () => onCreateNode('output'),
        },
        {
          key: 'process',
          label: '处理节点',
          icon: nodeTypes.process.icon,
          onClick: () => onCreateNode('process'),
        },
        {
          key: 'condition',
          label: '条件节点',
          icon: nodeTypes.condition.icon,
          onClick: () => onCreateNode('condition'),
        },
        {
          key: 'transform',
          label: '转换节点',
          icon: nodeTypes.transform.icon,
          onClick: () => onCreateNode('transform'),
        },
        {
          key: 'merge',
          label: '合并节点',
          icon: nodeTypes.merge.icon,
          onClick: () => onCreateNode('merge'),
        },
      ],
    },
    {
      key: 'advanced',
      label: <Text type="secondary" style={{ fontSize: 11 }}>高级节点</Text>,
      type: 'group',
      children: [
        {
          key: 'code',
          label: '代码块',
          icon: nodeTypes.code.icon,
          onClick: () => onCreateNode('code'),
        },
        {
          key: 'sql',
          label: 'SQL查询',
          icon: nodeTypes.sql.icon,
          onClick: () => onCreateNode('sql'),
        },
        {
          key: 'http',
          label: 'HTTP请求',
          icon: nodeTypes.http.icon,
          onClick: () => onCreateNode('http'),
        },
        {
          key: 'cache',
          label: '数据缓存',
          icon: nodeTypes.cache.icon,
          onClick: () => onCreateNode('cache'),
        },
        {
          key: 'log',
          label: '日志记录',
          icon: nodeTypes.log.icon,
          onClick: () => onCreateNode('log'),
        },
      ],
    },
    {
      key: 'processing',
      label: <Text type="secondary" style={{ fontSize: 11 }}>数据处理</Text>,
      type: 'group',
      children: [
        {
          key: 'filter',
          label: '数据过滤',
          icon: nodeTypes.filter.icon,
          onClick: () => onCreateNode('filter'),
        },
        {
          key: 'aggregate',
          label: '数据聚合',
          icon: nodeTypes.aggregate.icon,
          onClick: () => onCreateNode('aggregate'),
        },
        {
          key: 'sort',
          label: '数据排序',
          icon: nodeTypes.sort.icon,
          onClick: () => onCreateNode('sort'),
        },
        {
          key: 'sample',
          label: '数据采样',
          icon: nodeTypes.sample.icon,
          onClick: () => onCreateNode('sample'),
        },
        {
          key: 'validate',
          label: '数据验证',
          icon: nodeTypes.validate.icon,
          onClick: () => onCreateNode('validate'),
        },
      ],
    },
  ];

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        ...menuStyle,
        zIndex: 1000,
      }}
    >
      <Menu
        mode="vertical"
        items={menuItems}
        style={{
          borderRadius: 10,
          padding: '6px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          maxHeight: '70vh',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      />
    </div>
  );
}
