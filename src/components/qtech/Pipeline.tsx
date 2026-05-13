export interface PipelineStage {
  label: string;
  state: 'done' | 'active' | 'pending';
}

export function Pipeline({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="qt-pipeline">
      {stages.map((s, i) => (
        <div key={i} className={`qt-stage ${s.state}`}>
          <div className="n">المرحلة {i + 1}</div>
          <div className="t">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
