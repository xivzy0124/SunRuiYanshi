import { useState } from 'react';
import Header from './components/Header';
import SectionTitle from './components/SectionTitle';
import UnifiedPipeline from './components/UnifiedPipeline';
import DetailPanel from './components/DetailPanel';
import LineageGraph from './components/LineageGraph';
import MockWorkbench from './components/MockWorkbench';
import './styles/etl.css';

function PipelinePage() {
  const [activeId, setActiveId] = useState(null);

  const handleNodeClick = (id) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="etl-app">
      <Header />

      <UnifiedPipeline activeId={activeId} onNodeClick={handleNodeClick} />

      <DetailPanel activeId={activeId} onClose={() => setActiveId(null)} />

      <SectionTitle color="var(--accent3)" hint="字段级来源与去向追踪 · 9 衍生字段 · 6 阶段">全链路数据血缘图谱</SectionTitle>
      <LineageGraph />
    </div>
  );
}

function App() {
  const [page, setPage] = useState('workbench');
  return page === 'pipeline'
    ? <PipelinePage />
    : <MockWorkbench onPipelineReady={() => setPage('pipeline')} />;
}

export default App;
