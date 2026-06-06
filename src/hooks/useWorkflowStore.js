import { useState, useCallback } from 'react';

// 初始状态
const initialState = {
  // 当前页面
  currentPage: 'monitor',

  // 流程步骤状态
  stepStatus: {
    monitor: 'completed',
    ai: 'pending',
    workflow: 'pending',
    execute: 'pending',
  },

  // 工作流状态
  workflowStatus: {
    monitor: 'running',
    workflow: 'idle',
    pipeline: 'idle',
  },

  // AI 助手状态
  aiState: {
    isAnalyzing: false,
    lastSuggestion: null,
    generatedWorkflow: null,
  },

  // 工作流配置
  workflowConfig: {
    nodes: [],
    edges: [],
    metadata: {
      name: '',
      description: '',
      version: '1.0.0',
    },
  },

  // 执行历史
  executionHistory: [],

  // 数据源配置
  dataSources: {
    pressure: {
      enabled: true,
      endpoint: '/api/pressure',
      format: 'json',
      sampleRate: 30,
    },
    posture: {
      enabled: true,
      endpoint: '/api/posture',
      format: 'json',
      sampleRate: 30,
    },
  },
};

export default function useWorkflowStore() {
  const [state, setState] = useState(initialState);

  // 切换页面
  const setCurrentPage = useCallback((page) => {
    setState((prev) => ({
      ...prev,
      currentPage: page,
    }));
  }, []);

  // 更新步骤状态
  const updateStepStatus = useCallback((stepId, status) => {
    setState((prev) => ({
      ...prev,
      stepStatus: {
        ...prev.stepStatus,
        [stepId]: status,
      },
    }));
  }, []);

  // 更新工作流状态
  const updateWorkflowStatus = useCallback((page, status) => {
    setState((prev) => ({
      ...prev,
      workflowStatus: {
        ...prev.workflowStatus,
        [page]: status,
      },
    }));
  }, []);

  // 设置 AI 分析状态
  const setAIAnalyzing = useCallback((isAnalyzing) => {
    setState((prev) => ({
      ...prev,
      aiState: {
        ...prev.aiState,
        isAnalyzing,
      },
    }));
  }, []);

  // 设置 AI 生成的工作流
  const setAIGeneratedWorkflow = useCallback((workflow) => {
    setState((prev) => ({
      ...prev,
      aiState: {
        ...prev.aiState,
        generatedWorkflow: workflow,
        lastSuggestion: workflow?.name || null,
      },
      workflowConfig: {
        ...prev.workflowConfig,
        ...workflow,
      },
    }));
  }, []);

  // 更新工作流配置
  const updateWorkflowConfig = useCallback((config) => {
    setState((prev) => ({
      ...prev,
      workflowConfig: {
        ...prev.workflowConfig,
        ...config,
      },
    }));
  }, []);

  // 添加执行记录
  const addExecutionRecord = useCallback((record) => {
    setState((prev) => ({
      ...prev,
      executionHistory: [record, ...prev.executionHistory].slice(0, 50), // 保留最近 50 条
    }));
  }, []);

  // 更新数据源配置
  const updateDataSources = useCallback((sources) => {
    setState((prev) => ({
      ...prev,
      dataSources: {
        ...prev.dataSources,
        ...sources,
      },
    }));
  }, []);

  // 生成工作流（AI 生成）
  const generateWorkflow = useCallback(() => {
    setAIAnalyzing(true);

    // 模拟 AI 生成过程
    setTimeout(() => {
      const workflow = {
        nodes: [
          { id: 'input-pressure', type: 'input', label: '足底压力输入', x: 100, y: 200 },
          { id: 'input-posture', type: 'input', label: '三维姿态输入', x: 100, y: 400 },
          { id: 'filter-pressure', type: 'process', label: '压力数据过滤', x: 350, y: 200 },
          { id: 'filter-posture', type: 'process', label: '姿态数据过滤', x: 350, y: 400 },
          { id: 'map-pressure', type: 'transform', label: '压力字段标准化', x: 600, y: 200 },
          { id: 'map-posture', type: 'transform', label: '姿态字段标准化', x: 600, y: 400 },
          { id: 'calc-pressure', type: 'process', label: '压力特征计算', x: 850, y: 200 },
          { id: 'calc-posture', type: 'process', label: '姿态特征计算', x: 850, y: 400 },
          { id: 'join', type: 'merge', label: '双流融合 JOIN', x: 1100, y: 300 },
          { id: 'output-db', type: 'output', label: '数据入库', x: 1350, y: 250 },
          { id: 'output-api', type: 'output', label: 'API 发布', x: 1350, y: 350 },
        ],
        edges: [
          { source: 'input-pressure', target: 'filter-pressure' },
          { source: 'input-posture', target: 'filter-posture' },
          { source: 'filter-pressure', target: 'map-pressure' },
          { source: 'filter-posture', target: 'map-posture' },
          { source: 'map-pressure', target: 'calc-pressure' },
          { source: 'map-posture', target: 'calc-posture' },
          { source: 'calc-pressure', target: 'join' },
          { source: 'calc-posture', target: 'join' },
          { source: 'join', target: 'output-db' },
          { source: 'join', target: 'output-api' },
        ],
        metadata: {
          name: '力姿融合流水线',
          description: '足底压力与三维姿态数据融合处理',
          version: '1.0.0',
        },
      };

      setAIGeneratedWorkflow(workflow);
      updateStepStatus('ai', 'completed');
      updateStepStatus('workflow', 'completed');
      setAIAnalyzing(false);
    }, 2000);
  }, [setAIAnalyzing, setAIGeneratedWorkflow, updateStepStatus]);

  // 应用模板
  const applyTemplate = useCallback(
    (template) => {
      // 根据模板生成工作流配置
      const workflow = {
        nodes: generateNodesFromTemplate(template),
        edges: generateEdgesFromTemplate(template),
        metadata: {
          name: template.name,
          description: template.desc,
          version: '1.0.0',
        },
      };

      updateWorkflowConfig(workflow);
      updateStepStatus('workflow', 'completed');
      setCurrentPage('workflow');
    },
    [updateWorkflowConfig, updateStepStatus, setCurrentPage]
  );

  // 执行工作流
  const executeWorkflow = useCallback(() => {
    updateWorkflowStatus('pipeline', 'running');
    updateStepStatus('execute', 'running');

    // 模拟执行过程
    setTimeout(() => {
      const record = {
        id: `exec-${Date.now()}`,
        timestamp: new Date().toISOString(),
        workflow: state.workflowConfig.metadata.name || '未命名工作流',
        status: 'success',
        duration: `${(Math.random() * 3 + 1).toFixed(1)}s`,
        records: Math.floor(Math.random() * 5000 + 3000),
        nodes: state.workflowConfig.nodes.length,
        details: {
          input: { pressure: 10752, posture: 8144 },
          output: 6218,
          errors: 0,
          warnings: 0,
        },
      };

      addExecutionRecord(record);
      updateWorkflowStatus('pipeline', 'idle');
      updateStepStatus('execute', 'completed');
    }, 3000);
  }, [state.workflowConfig, updateWorkflowStatus, updateStepStatus, addExecutionRecord]);

  // 重置状态
  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    // 状态
    ...state,

    // 操作
    setCurrentPage,
    updateStepStatus,
    updateWorkflowStatus,
    setAIAnalyzing,
    setAIGeneratedWorkflow,
    updateWorkflowConfig,
    addExecutionRecord,
    updateDataSources,
    generateWorkflow,
    applyTemplate,
    executeWorkflow,
    resetState,
  };
}

// 辅助函数：从模板生成节点
function generateNodesFromTemplate(template) {
  const baseNodes = [
    { id: 'input-1', type: 'input', label: '数据输入', x: 100, y: 200 },
    { id: 'process-1', type: 'process', label: '数据处理', x: 350, y: 200 },
    { id: 'output-1', type: 'output', label: '数据输出', x: 600, y: 200 },
  ];

  // 根据模板类型添加更多节点
  if (template.id === 'fusion-pipeline') {
    return [
      { id: 'input-pressure', type: 'input', label: '足底压力输入', x: 100, y: 150 },
      { id: 'input-posture', type: 'input', label: '三维姿态输入', x: 100, y: 350 },
      { id: 'filter-1', type: 'process', label: '压力过滤', x: 300, y: 150 },
      { id: 'filter-2', type: 'process', label: '姿态过滤', x: 300, y: 350 },
      { id: 'map-1', type: 'transform', label: '压力标准化', x: 500, y: 150 },
      { id: 'map-2', type: 'transform', label: '姿态标准化', x: 500, y: 350 },
      { id: 'calc-1', type: 'process', label: '压力计算', x: 700, y: 150 },
      { id: 'calc-2', type: 'process', label: '姿态计算', x: 700, y: 350 },
      { id: 'join', type: 'merge', label: '数据融合', x: 900, y: 250 },
      { id: 'output-db', type: 'output', label: '数据入库', x: 1100, y: 200 },
      { id: 'output-api', type: 'output', label: 'API 发布', x: 1100, y: 300 },
    ];
  }

  return baseNodes;
}

// 辅助函数：从模板生成边
function generateEdgesFromTemplate(template) {
  if (template.id === 'fusion-pipeline') {
    return [
      { source: 'input-pressure', target: 'filter-1' },
      { source: 'input-posture', target: 'filter-2' },
      { source: 'filter-1', target: 'map-1' },
      { source: 'filter-2', target: 'map-2' },
      { source: 'map-1', target: 'calc-1' },
      { source: 'map-2', target: 'calc-2' },
      { source: 'calc-1', target: 'join' },
      { source: 'calc-2', target: 'join' },
      { source: 'join', target: 'output-db' },
      { source: 'join', target: 'output-api' },
    ];
  }

  return [
    { source: 'input-1', target: 'process-1' },
    { source: 'process-1', target: 'output-1' },
  ];
}
