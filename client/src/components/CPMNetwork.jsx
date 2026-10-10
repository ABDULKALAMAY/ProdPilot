import { layoutNetwork } from '../utils/networkLayout';
import { useRef, useState } from 'react';
import { downloadNetworkPng } from '../utils/networkExport';

export const number = (value) => String(value);

export default function CPMNetwork({ cpm }) {
  const svgRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');
  const { positions, edges, width, height } = layoutNetwork(cpm);
  async function exportPng() {
    setExporting(true);
    setExportError('');
    try { await downloadNetworkPng(svgRef.current); }
    catch (error) { setExportError(error.message); }
    finally { setExporting(false); }
  }
  return <>
    <div className="stat-grid cpm-stats"><article><div><strong>{number(cpm.duration)}</strong><p>Project duration · days</p></div></article><article><div><strong>{cpm.activities.length}</strong><p>Activities · {cpm.criticalActivities.length} critical</p></div></article><article><div><strong>{cpm.criticalPathCount}</strong><p>Critical paths · total float {number(cpm.totalFloat)} days</p></div></article></div>
    <section className="content-card"><div className="section-heading"><div><h2>Project network</h2><p>Green nodes and arrows mark all critical paths. Scroll to explore the network.</p></div><button className="button secondary" onClick={exportPng} disabled={exporting}>{exporting ? 'Exporting…' : 'Download PNG'}</button></div>
      {exportError && <div className="form-error" role="alert">{exportError}</div>}
      <div className="network-scroll" tabIndex={0} role="region" aria-label="Scrollable CPM network">
        <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="network-title network-description">
          <title id="network-title">Critical path network</title><desc id="network-description">Activities connected from START to FINISH. Critical activities: {cpm.criticalActivities.join(', ') || 'none'}. All timings are listed in the table below.</desc>
          <defs>{[['normal', '#63758b'], ['critical', '#527c08']].map(([id, color]) => <marker key={id} id={`arrow-${id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill={color} /></marker>)}</defs>
          {edges.map((edge) => <path key={`${edge.from}-${edge.to}`} className={`network-edge ${edge.critical ? 'critical' : ''}`} d={edge.path} markerEnd={`url(#arrow-${edge.critical ? 'critical' : 'normal'})`}><title>{edge.from} → {edge.to}{edge.critical ? ' · critical' : ''}</title></path>)}
          {['START', 'FINISH'].map((id) => { const pos = positions.get(id); return <g key={id} transform={`translate(${pos.x},${pos.y})`}><rect className="network-terminal" width="220" height="120" rx="18" /><text x="110" y="65" textAnchor="middle" className="terminal-label">{id}</text></g>; })}
          {cpm.activities.map((activity) => { const pos = positions.get(activity.id); return <g key={activity.id} className={`network-node ${activity.critical ? 'critical' : ''}`} transform={`translate(${pos.x},${pos.y})`}>
            <title>{activity.id}: {activity.name} · duration {activity.duration} · ES {activity.es} · EF {activity.ef} · LS {activity.ls} · LF {activity.lf} · Float {activity.float}{activity.critical ? ' · Critical activity' : ''}</title>
            <rect width="220" height="120" rx="12" /><text x="12" y="23" className="node-title">{`${activity.id} · ${activity.name}`.slice(0, 26)}{`${activity.id} · ${activity.name}`.length > 26 ? '…' : ''}</text>
            <text x="12" y="44">Duration {number(activity.duration)}{activity.critical ? ' · CRITICAL' : ''}</text>
            <text x="12" y="68">ES {number(activity.es)}</text><text x="118" y="68">EF {number(activity.ef)}</text>
            <text x="12" y="89">LS {number(activity.ls)}</text><text x="118" y="89">LF {number(activity.lf)}</text>
            <text x="12" y="110">Float {number(activity.float)}</text>
          </g>; })}
        </svg>
      </div>
      {!cpm.activities.length && <p className="muted">Add activities to calculate the project schedule.</p>}
      <details open className="critical-paths"><summary>Critical paths ({cpm.criticalPathCount})</summary>{cpm.criticalPaths.map((path, index) => <p key={index}>START → {path.join(' → ')} → FINISH</p>)}{cpm.pathsTruncated && <p>Showing the first 1,000 paths. The graph highlights all {cpm.criticalPathCount} paths.</p>}</details>
      <p className="muted">Float is each activity’s scheduling allowance. The sum of activity floats is not extra time available to the whole project. Day 0 is the project start date; weekends are not excluded.</p>
      <div className="table-scroll"><table className="project-table"><caption>CPM timings in days from project start</caption><thead><tr>{['Activity', 'Duration', 'ES', 'EF', 'LS', 'LF', 'Float'].map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{cpm.activities.map((activity) => <tr key={activity.id} className={activity.critical ? 'critical-row' : ''}><th>{activity.id} · {activity.name}{activity.critical && ' ★'}</th>{['duration', 'es', 'ef', 'ls', 'lf', 'float'].map((key) => <td key={key}>{number(activity[key])}</td>)}</tr>)}</tbody></table></div>
    </section>
  </>;
}
