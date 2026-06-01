import { useState } from 'react';
import Navigation from './components/Navigation';
import AIAssistant from './components/AIAssistant';
import WorkflowTemplate from './components/WorkflowTemplate';
import ExecutionHistory from './components/ExecutionHistory';
import MockWorkbench from './components/MockWorkbench';
import WorkflowEditor from './components/WorkflowEditor';
import PipelinePage from './components/PipelinePage';
import useWorkflowStore from './hooks/useWorkflowStore';
import useTheme from './hooks/useTheme';
import './styles/theme.css';
import './styles/unified.css';
import './styles/etl.css';

function App() {
  const store = useWorkflowStore();
  const { theme, toggleTheme } = useTheme();
  const [showTemplate, setShowTemplate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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

  // AI 生成工作流
  const handleGenerateWorkflow = () => {
    store.generateWorkflow();
    // 自动切换到工作流页面
    setTimeout(() => {
      store.setCurrentPage('workflow');
    }, 2500);
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

  // 渲染当前页面
  const renderCurrentPage = () => {
    switch (store.currentPage) {
      case 'monitor':
        return (
          <MockWorkbench
            onPipelineReady={() => handlePageChange('pipeline')}
            onOpenWorkflow={() => handlePageChange('workflow')}
            onGenerateWorkflow={handleGenerateWorkflow}
          />
        );
      case 'workflow':
        return (
          <WorkflowEditor
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

  return (
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
      <div className="page-content">{renderCurrentPage()}</div>

      {/* AI 助手 */}
      <AIAssistant
        onGenerateWorkflow={handleGenerateWorkflow}
        onApplyOptimization={(optimization) => {
          console.log('Apply optimization:', optimization);
        }}
      />

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
  );
}

export default App;
