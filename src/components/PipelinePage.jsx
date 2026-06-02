import { useState, useEffect } from 'react';
import Header from './Header';
import SectionTitle from './SectionTitle';
import UnifiedPipeline from './UnifiedPipeline';
import DetailPanel from './DetailPanel';
import LineageGraph from './LineageGraph';

export default function PipelinePage({ onBack }) {
  const [activeId, setActiveId] = useState(null);
  const [phase, setPhase] = useState(0); // 0=初始 1=管线 2=标题 3=血缘

  const handleNodeClick = (id) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  // 逐段显示
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),   // 管线
      setTimeout(() => setPhase(2), 1200),   // 标题
      setTimeout(() => setPhase(3), 1600),   // 血缘图谱
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="etl-app">
      <Header onBack={onBack} />

      {/* 管线区域 */}
      <div
        className="reveal-section"
        style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
      >
        {phase >= 1 && <UnifiedPipeline activeId={activeId} onNodeClick={handleNodeClick} />}
      </div>

      <DetailPanel activeId={activeId} onClose={() => setActiveId(null)} />

      {/* 血缘标题 */}
      {phase >= 2 && (
        <div
          className="reveal-section"
          style={{ animationDelay: '0s', animationFillMode: 'backwards' }}
        >
          <SectionTitle color="var(--accent3)" hint="字段级来源与去向追踪 · 9 衍生字段 · 6 阶段">
            全链路数据血缘图谱
          </SectionTitle>
        </div>
      )}

      {/* 血缘图谱 */}
      {phase >= 3 && (
        <div
          className="reveal-lineage"
          style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
        >
          <LineageGraph />
        </div>
      )}
    </div>
  );
}
