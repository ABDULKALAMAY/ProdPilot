export function invalid(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

// Remove floating-point arithmetic noise without truncating fractional durations.
const clean = (value) => Number(value.toPrecision(15));
const equal = (a, b) => Math.abs(a - b) <= Number.EPSILON * 32 * Math.max(Math.abs(a), Math.abs(b), Number.MIN_VALUE);

export function calculateCPM(activities) {
  if (!Array.isArray(activities)) invalid('Activities must be an array.');
  if (activities.length > 200) invalid('A project supports up to 200 activities.');
  const nodes = new Map();
  for (const activity of activities) {
    if (!activity || typeof activity.id !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(activity.id) || ['START', 'FINISH'].includes(activity.id)) invalid('Activity IDs must be unique letters, numbers, underscores or hyphens (1–40 characters); START and FINISH are reserved.');
    if (nodes.has(activity.id)) invalid(`Duplicate activity ID: ${activity.id}.`);
    if (typeof activity.duration !== 'number' || !Number.isFinite(activity.duration) || activity.duration < 0 || activity.duration > 1e9) invalid(`Activity ${activity.id}: duration must be a finite number between 0 and 1,000,000,000.`);
    if (!Array.isArray(activity.predecessors) || activity.predecessors.some((id) => typeof id !== 'string')) invalid(`Activity ${activity.id}: predecessors must be a list of activity IDs.`);
    if (new Set(activity.predecessors).size !== activity.predecessors.length) invalid(`Activity ${activity.id}: duplicate predecessor.`);
    nodes.set(activity.id, { id: activity.id, name: activity.name, duration: activity.duration, predecessors: activity.predecessors, successors: [], es: 0, ef: 0, ls: 0, lf: 0, float: 0, level: 1 });
  }
  for (const node of nodes.values()) {
    for (const id of node.predecessors) {
      if (!nodes.has(id)) invalid(`Activity ${node.id}: predecessor ${id} does not exist.`);
      nodes.get(id).successors.push(node.id);
    }
  }
  const degree = new Map([...nodes.values()].map((node) => [node.id, node.predecessors.length]));
  const order = [...nodes.values()].filter((node) => !node.predecessors.length).map((node) => node.id);
  for (let index = 0; index < order.length; index++) {
    const node = nodes.get(order[index]);
    node.es = Math.max(0, ...node.predecessors.map((id) => nodes.get(id).ef));
    node.ef = clean(node.es + node.duration);
    node.level = 1 + Math.max(0, ...node.predecessors.map((id) => nodes.get(id).level));
    for (const id of node.successors) {
      degree.set(id, degree.get(id) - 1);
      if (degree.get(id) === 0) order.push(id);
    }
  }
  if (order.length !== nodes.size) invalid('Circular dependency detected. Remove a predecessor link to break the cycle.');
  // One connected activity network; multiple roots/terminals are allowed when branches merge/split.
  if (nodes.size) {
    const visited = new Set();
    const pending = [order[0]];
    while (pending.length) {
      const id = pending.pop();
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodes.get(id);
      pending.push(...node.predecessors, ...node.successors);
    }
    if (visited.size !== nodes.size) invalid('Disconnected activities: connect every activity to the project network using predecessors.');
  }
  const duration = Math.max(0, ...[...nodes.values()].filter((node) => !node.successors.length).map((node) => node.ef));
  for (const id of [...order].reverse()) {
    const node = nodes.get(id);
    node.lf = node.successors.length ? Math.min(...node.successors.map((next) => nodes.get(next).ls)) : duration;
    node.ls = clean(node.lf - node.duration);
    node.float = equal(node.ls, node.es) || equal(node.lf, node.ef) ? 0 : clean(node.ls - node.es);
    node.critical = node.float === 0;
  }
  const edges = [];
  for (const node of nodes.values()) {
    if (!node.predecessors.length) edges.push({ from: 'START', to: node.id, critical: node.critical && node.es === 0 });
    for (const from of node.predecessors) edges.push({ from, to: node.id, critical: nodes.get(from).critical && node.critical && equal(nodes.get(from).ef, node.es) });
    if (!node.successors.length) edges.push({ from: node.id, to: 'FINISH', critical: node.critical && equal(node.ef, duration) });
  }
  if (!nodes.size) edges.push({ from: 'START', to: 'FINISH', critical: false });
  const criticalNext = new Map(['START', ...order, 'FINISH'].map((id) => [id, []]));
  edges.filter((edge) => edge.critical).forEach((edge) => criticalNext.get(edge.from).push(edge.to));
  const counts = new Map([['FINISH', 1n]]);
  for (const id of [...order].reverse().concat('START')) counts.set(id, criticalNext.get(id).reduce((sum, next) => sum + counts.get(next), 0n));
  // The critical-edge DAG and exact count represent ALL paths. Bound only the textual preview.
  const criticalPaths = [];
  function visit(id, path) {
    if (criticalPaths.length >= 1000) return;
    if (id === 'FINISH') { criticalPaths.push(path); return; }
    for (const next of criticalNext.get(id)) visit(next, next === 'FINISH' ? path : [...path, next]);
  }
  visit('START', []);
  return { duration, activities: order.map((id) => nodes.get(id)), edges, criticalActivities: order.filter((id) => nodes.get(id).critical), criticalPaths, criticalPathCount: counts.get('START').toString(), pathsTruncated: counts.get('START') > BigInt(criticalPaths.length), totalFloat: clean([...nodes.values()].reduce((sum, node) => sum + node.float, 0)) };
}
