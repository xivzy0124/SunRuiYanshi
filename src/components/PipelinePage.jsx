import { useState, useEffect } from 'react';
import Header from './Header';
import SectionTitle from './SectionTitle';
import UnifiedPipeline from './UnifiedPipeline';
import DetailPanel from './DetailPanel';
import LineageGraph from './LineageGraph';

export default function PipelinePage({ onBack }) {
  const [activeId, setActiveId] = useState(null);
  const [phase, setPhase] = useState(0);

  const handleNodeClick = (id) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 150);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div className="etl-app">
      <Header onBack={onBack} />

      {/* 管线区域 */}
      <div className={`pipe-reveal ${phase >= 1 ? 'visible' : ''}`}>
        <UnifiedPipeline activeId={activeId} onNodeClick={handleNodeClick} />
      </div>

      <DetailPanel activeId={activeId} onClose={() => setActiveId(null)} />

      {/* 血缘标题 */}
      <div className={`pipe-reveal ${phase >= 2 ? 'visible' : ''}`}>
        <SectionTitle color="var(--accent3)" hint="字段级来源与去向追踪 · 9 衍生字段 · 6 阶段">
          全链路数据血缘图谱
        </SectionTitle>
      </div>

      {/* 血缘图谱 */}
      <div className={`pipe-reveal ${phase >= 3 ? 'visible' : ''}`}>
        <LineageGraph />
      </div>
    </div>
  );
}
