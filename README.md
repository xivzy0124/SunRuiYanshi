# 数据调试中心 & 工作流编辑器

基于 React + Vite + Tailwind CSS 4 构建的前端应用。

## 技术栈

- **React 19** - UI 框架
- **Vite 8** - 构建工具
- **Tailwind CSS 4** - 样式框架
- **Prettier** - 代码格式化
- **ESLint** - 代码检查

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run lint         # 运行 ESLint 检查
npm run lint:fix     # 自动修复 ESLint 错误
npm run format       # 使用 Prettier 格式化代码
npm run format:check # 检查代码格式
npm run preview      # 预览生产构建
```

## 项目结构

```
src/
├── components/      # React 组件
├── data/           # 数据文件
├── hooks/          # 自定义 Hooks
├── styles/         # CSS 样式文件
├── App.jsx         # 主应用组件
└── main.jsx        # 入口文件
```

## VS Code 推荐扩展

项目包含 `.vscode/extensions.json`，打开项目时会自动推荐安装以下扩展：

- Prettier - 代码格式化
- ESLint - 代码检查
- Tailwind CSS IntelliSense - Tailwind 智能提示
- ES7+ React Snippets - React 代码片段

## 功能

### 页面一：数据调试中心
- 实时数据监控
- 体态指标分析
- 足底压力可视化

### 页面二：流水线页面
- ETL 流程展示
- 数据血缘追踪

### 页面三：工作流编辑器
- 可视化工作流编排
- 拖拽式节点操作
- 节点连线功能
