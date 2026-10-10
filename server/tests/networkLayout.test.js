import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCPM } from '../src/services/cpm.js';
import { layoutNetwork } from '../../client/src/utils/networkLayout.js';

test('CampusPay branches retain rows and connectors avoid unrelated nodes', () => {
  const activities = [
    ['A', 3, []], ['B', 4, ['A']], ['C', 5, ['B']], ['D', 8, ['A']],
    ['E', 6, ['D']], ['F', 9, ['C']], ['G', 3, ['D']], ['H', 4, ['E', 'F']],
    ['I', 6, ['H', 'G']], ['J', 4, ['I']], ['K', 2, ['J']], ['L', 3, ['C']], ['M', 2, ['J', 'L']]
  ].map(([id, duration, predecessors]) => ({ id, name: id, duration, predecessors }));
  const cpm = calculateCPM(activities);
  const { positions, edges } = layoutNetwork(cpm);
  assert.equal(positions.get('D').lane, positions.get('E').lane);
  assert.equal(new Set(['E', 'G', 'L'].map((id) => positions.get(id).lane)).size, 3);
  for (const id of ['A', 'B', 'C', 'F', 'H', 'I', 'J', 'K']) assert.equal(positions.get(id).lane, 0);
  for (const edge of edges) {
    for (let i = 1; i < edge.points.length; i++) {
      const [x1, y1] = edge.points[i - 1], [x2, y2] = edge.points[i];
      for (const [id, p] of positions) {
        if (id === edge.from || id === edge.to) continue;
        const intersects = x1 === x2
          ? x1 > p.x && x1 < p.x + 220 && Math.max(y1, y2) > p.y && Math.min(y1, y2) < p.y + 120
          : y1 > p.y && y1 < p.y + 120 && Math.max(x1, x2) > p.x && Math.min(x1, x2) < p.x + 220;
        assert.ok(!intersects, `${edge.from} → ${edge.to} intersects ${id}`);
      }
    }
  }
  assert.equal(cpm.duration, 37);
  assert.equal(cpm.criticalPathCount, '2');
});
