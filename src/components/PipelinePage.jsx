import { useState } from 'react';
import Header from './Header';
import SectionTitle from './SectionTitle';
import UnifiedPipeline from './UnifiedPipeline';
import DetailPanel from './DetailPanel';
import LineageGraph from './LineageGraph';

export default function PipelinePage({ onBack }) {
  const [activeId, setActiveId] = useState(null);

  const handleNodeClick = (id) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="etl-app">
      <Header onBack={onBack} />

      <UnifiedPipeline activeId={activeId} onNodeClick={handleNodeClick} />

      <DetailPanel activeId={activeId} onClose={() => setActiveId(null)} />

      <SectionTitle color="var(--accent3)" hint="字段级来源与去向追踪 · 9 衍生字段 · 6 阶段">
        全链路数据血缘图谱
      </SectionTitle>
      <LineageGraph />
    </div>
  );
}
