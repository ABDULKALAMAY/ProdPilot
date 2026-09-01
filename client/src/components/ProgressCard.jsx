export default function ProgressCard({ completed, total }) {
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return <section className="progress-card"><div><p className="eyebrow">YOUR PROGRESS</p><h2>{percent}% complete</h2><p className="muted">{completed} of {total} tasks finished</p></div><div className="progress-ring" style={{ '--progress': `${percent * 3.6}deg` }}><span>{percent}%</span></div></section>;
}
