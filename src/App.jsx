import { useState, useRef, useCallback } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Navigation from './components/Navigation';
import AIAssistant from './components/AIAssistant';
import WorkflowTemplate from './components/WorkflowTemplate';
import ExecutionHistory from './components/ExecutionHistory';
import MockWorkbench from './components/MockWorkbench';
import WorkflowEditor from './components/WorkflowEditor';
import PipelinePage from './components/PipelinePage';
import useWorkflowStore from './hooks/useWorkflowStore';
import useTheme from './hooks/useTheme';
import { lightTheme, darkTheme } from './theme';
import './styles/theme.css';
import './styles/unified.css';
import './styles/etl.css';

function App() {
  const store = useWorkflowStore();
  const { theme, toggleTheme } = useTheme();
  const [showTemplate, setShowTemplate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const workflowEditorRef = useRef(null);

  // 页面切换处理
  const handlePageChange = (page) => {
    store.setCurrentPage(page);

    // 更新步骤状态
    if (page === 'monitor') {
      store.updateStepStatus('monitor', 'completed');
    } else if (page === 'workflow') {
      store.updateStepStatus('workflow', 'running');
    } else if (page === 'pipeline') {
      store.updateStepStatus('execute', 'running');
    }
  };

  // 应用模板
  const handleApplyTemplate = (template) => {
    store.applyTemplate(template);
    setShowTemplate(false);
  };

  // 执行工作流
  const handleExecuteWorkflow = () => {
    store.executeWorkflow();
    store.setCurrentPage('pipeline');
  };

  // 重新执行
  const handleRerun = (_exec) => {
    store.executeWorkflow();
    setShowHistory(false);
  };

  // AI 生成工作流并注入编辑器
  const handleWorkflowGenerated = useCallback(
    (workflow, opts = {}) => {
      // 切换到工作流编辑器页面
      store.setCurrentPage('workflow');
      store.updateStepStatus('workflow', 'running');

      // 延迟注入，等待页面切换和编辑器挂载完成
      setTimeout(() => {
        workflowEditorRef.current?.injectWorkflow(workflow);
      }, 300);

      // 语音指令：注入并展示片刻后，缓慢切换到第三页（流水线执行页）
      if (opts.fromVoice) {
        setTimeout(() => {
          store.executeWorkflow();
          store.updateStepStatus('execute', 'running');
          store.setCurrentPage('pipeline');
        }, 2600);
      }
    },
    [store]
  );

  // 渲染当前页面
  const renderCurrentPage = () => {
    switch (store.currentPage) {
      case 'monitor':
        return (
          <MockWorkbench
            onPipelineReady={() => handlePageChange('pipeline')}
            onOpenWorkflow={() => handlePageChange('workflow')}
          />
        );
      case 'workflow':
        return (
          <WorkflowEditor
            ref={workflowEditorRef}
            onBack={() => handlePageChange('monitor')}
            onExecute={handleExecuteWorkflow}
            onShowTemplate={() => setShowTemplate(true)}
            onShowHistory={() => setShowHistory(true)}
            workflowConfig={store.workflowConfig}
            onConfigChange={store.updateWorkflowConfig}
          />
        );
      case 'pipeline':
        return <PipelinePage onBack={() => handlePageChange('workflow')} />;
      default:
        return null;
    }
  };

  // 选择主题配置
  const currentThemeConfig = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        ...currentThemeConfig,
        algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
      }}
    >
      <div className="app-container">
        {/* 顶部导航 */}
        <Navigation
          currentPage={store.currentPage}
          onPageChange={handlePageChange}
          workflowStatus={store.workflowStatus}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* 页面内容 */}
        <div className="page-content" key={store.currentPage}>
          {renderCurrentPage()}
        </div>

        {/* AI 助手 — 仅在工作流编辑器页面显示 */}
        {store.currentPage === 'workflow' && (
          <AIAssistant onWorkflowGenerated={handleWorkflowGenerated} />
        )}

        {/* 工作流模板库 */}
        {showTemplate && (
          <WorkflowTemplate
            onApplyTemplate={handleApplyTemplate}
            onClose={() => setShowTemplate(false)}
          />
        )}

        {/* 执行历史 */}
        {showHistory && (
          <ExecutionHistory onClose={() => setShowHistory(false)} onRerun={handleRerun} />
        )}
      </div>
    </ConfigProvider>
  );
}

export default App;
