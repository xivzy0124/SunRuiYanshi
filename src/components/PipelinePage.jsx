import { useState, useEffect } from 'react';
import { PipelineHeader } from './PageHeader';
import SectionTitle from './SectionTitle';
import UnifiedPipeline from './UnifiedPipeline';
import DetailPanel from './DetailPanel';
import LineageGraph from './LineageGraph';
import FilterFunnel3D from './FilterFunnel3D';

export default function PipelinePage({ onBack }) {
  const [activeId, setActiveId] = useState(null);
  const [phase, setPhase] = useState(0);

  const handleNodeClick = (id) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  // 慢节奏，像 AI 在逐步分析
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => setPhase(3), 3200);
    const t4 = setTimeout(() => setPhase(4), 4200);
    return () => { [t1, t2, t3, t4].forEach(clearTimeout); };
  }, []);

  return (
    <div className="etl-app">
      <PipelineHeader onBack={onBack} />

      <div className={`pipe-reveal ${phase >= 1 ? 'visible' : ''}`}>
        <SectionTitle color="var(--accent)" hint="双源异构数据 → 过滤 · 映射 · 融合 · 校验 · 入库/发布">
          ① 双源融合治理流水线
        </SectionTitle>
        <UnifiedPipeline activeId={activeId} onNodeClick={handleNodeClick} />
      </div>

      <DetailPanel activeId={activeId} onClose={() => setActiveId(null)} />

      <div className={`pipe-reveal ${phase >= 2 ? 'visible' : ''}`}>
        <SectionTitle color="var(--accent3)" hint="3D 全字段级血缘 · 27 源字段 · 14 派生指标 · 点击节点看关系">
          ② 全链路数据血缘图谱
        </SectionTitle>
      </div>

      <div className={`pipe-reveal ${phase >= 3 ? 'visible' : ''}`}>
        <LineageGraph />
      </div>

      <div className={`pipe-reveal ${phase >= 4 ? 'visible' : ''}`}>
        <div className="ff-bridge">
          <div className="ff-bridge-channel">
            <i /><i /><i />
          </div>
          <div className="ff-bridge-caption">
            上方血缘图谱的 <b>27 源字段</b>，流经数据治理流水线
            <em>逐层 过滤 · 映射 · 融合 · 入库</em>
          </div>
        </div>
        <SectionTitle color="var(--cyan)" hint="承接 27 源字段 · 按列级转换类型逐层沉降停驻于所属层">
          ③ 字段过滤与数据沉降
        </SectionTitle>
        <FilterFunnel3D />
      </div>
    </div>
  );
}
