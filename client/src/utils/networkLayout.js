const NODE_WIDTH = 220, NODE_HEIGHT = 120, COLUMN = 320, ROW = 180;

function roundedPath(points) {
  let path = `M${points[0].join(',')}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i], before = points[i - 1], after = points[i + 1];
    const distanceIn = Math.hypot(x - before[0], y - before[1]);
    const distanceOut = Math.hypot(after[0] - x, after[1] - y);
    if (!distanceIn || !distanceOut) continue;
    const radius = Math.min(12, distanceIn / 2, distanceOut / 2);
    const entry = [x + (before[0] - x) * radius / distanceIn, y + (before[1] - y) * radius / distanceIn];
    const exit = [x + (after[0] - x) * radius / distanceOut, y + (after[1] - y) * radius / distanceOut];
    path += ` L${entry.join(',')} Q${x},${y} ${exit.join(',')}`;
  }
  return `${path} L${points.at(-1).join(',')}`;
}

export function layoutNetwork(cpm) {
  const lastLevel = Math.max(0, ...cpm.activities.map((a) => a.level)) + 1;
  const positions = new Map([['START', { x: 30, y: 40, lane: 0 }]]);
  const reservations = [];
  const activities = [...cpm.activities].sort((a, b) => a.level - b.level || Number(b.critical) - Number(a.critical));
  for (const activity of activities) {
    const parents = activity.predecessors.map((id) => positions.get(id));
    const criticalParents = activity.predecessors.filter((id) => cpm.edges.some((edge) => edge.from === id && edge.to === activity.id && edge.critical)).map((id) => positions.get(id).lane);
    const preferred = activity.critical ? (criticalParents.length ? Math.min(...criticalParents) : 0) : Math.max(1, ...parents.map((p) => p.lane));
    let lane = preferred;
    // Reserve a branch's row until its merge so later columns do not jump into its connectors.
    while (reservations[lane] && (reservations[lane].level === activity.level ||
      (reservations[lane].until >= activity.level && !activity.predecessors.includes(reservations[lane].id)))) lane++;
    const successorLevels = cpm.edges.filter((edge) => edge.from === activity.id).map((edge) => edge.to === 'FINISH' ? lastLevel : cpm.activities.find((a) => a.id === edge.to).level);
    reservations[lane] = { id: activity.id, level: activity.level, until: Math.max(activity.level, ...successorLevels.map((level) => level - 1)) };
    positions.set(activity.id, { x: activity.level * COLUMN + 30, y: lane * ROW + 40, lane });
  }
  positions.set('FINISH', { x: lastLevel * COLUMN + 30, y: 40, lane: 0 });
  let height = Math.max(...[...positions.values()].map((p) => p.y + NODE_HEIGHT)) + 50;
  const edges = cpm.edges.map((edge) => {
    const from = positions.get(edge.from), to = positions.get(edge.to);
    const outgoing = cpm.edges.filter((e) => e.from === edge.from).sort((a, b) => positions.get(a.to).y - positions.get(b.to).y);
    const incoming = cpm.edges.filter((e) => e.to === edge.to).sort((a, b) => positions.get(a.from).y - positions.get(b.from).y);
    const sourceIndex = outgoing.indexOf(edge), targetIndex = incoming.indexOf(edge);
    const offset = (index, count) => (index - (count - 1) / 2) * Math.min(16, 80 / Math.max(1, count - 1));
    const x1 = from.x + NODE_WIDTH, y1 = from.y + 60 + offset(sourceIndex, outgoing.length);
    const x2 = to.x - 6, y2 = to.y + 60 + offset(targetIndex, incoming.length);
    const bend = to.x - 28 - targetIndex * Math.min(14, 45 / Math.max(1, incoming.length - 1));
    const blocked = [...positions.entries()].some(([id, p]) => id !== edge.from && id !== edge.to && p.x < bend && p.x + NODE_WIDTH > x1 && y1 >= p.y - 10 && y1 <= p.y + NODE_HEIGHT + 10);
    let points;
    if (blocked) {
      // Unusual shortcut edges get their own outer track, never a shared line through nodes.
      const track = height;
      height += 24;
      points = [[x1, y1], [x1 + 20 + sourceIndex * 8, y1], [x1 + 20 + sourceIndex * 8, track], [bend, track], [bend, y2], [x2, y2]];
    } else points = [[x1, y1], [bend, y1], [bend, y2], [x2, y2]];
    return { ...edge, path: roundedPath(points), points };
  });
  return { positions, edges, width: (lastLevel + 1) * COLUMN + 20, height: height + 20 };
}
