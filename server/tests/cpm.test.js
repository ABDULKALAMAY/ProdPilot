import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCPM } from '../src/services/cpm.js';
import { suggestAssignments } from '../src/services/assignment.js';
import { parseMembers } from '../../client/src/utils/memberImport.js';

export const activity = (id, duration, predecessors = []) => ({ id, name: id, duration, predecessors });
export const example = [activity('A', 4), activity('B', 3, ['A']), activity('C', 6, ['A']), activity('D', 5, ['B']), activity('E', 2, ['C']), activity('F', 4, ['D', 'E'])];

test('CPM material: duration 16, both complete critical paths and timings', () => {
  const result = calculateCPM(example);
  assert.equal(result.duration, 16);
  assert.deepEqual(result.criticalPaths, [['A', 'B', 'D', 'F'], ['A', 'C', 'E', 'F']]);
  assert.equal(result.criticalPathCount, '2');
  assert.deepEqual(result.activities.map(({ id, es, ef, ls, lf, float }) => [id, es, ef, ls, lf, float]), [
    ['A', 0, 4, 0, 4, 0], ['B', 4, 7, 4, 7, 0], ['C', 4, 10, 4, 10, 0], ['D', 7, 12, 7, 12, 0], ['E', 10, 12, 10, 12, 0], ['F', 12, 16, 12, 16, 0]
  ]);
  assert.ok(result.edges.every((edge) => edge.critical));
});
test('decimal durations and noncritical branch retain fractional float', () => {
  const result = calculateCPM([activity('A', 2.5), activity('B', 3.5, ['A']), activity('C', 1.25, ['A']), activity('D', 2.75, ['B', 'C'])]);
  assert.equal(result.duration, 8.75);
  assert.deepEqual(result.criticalPaths, [['A', 'B', 'D']]);
  const c = result.activities.find((item) => item.id === 'C');
  assert.deepEqual([c.es, c.ef, c.ls, c.lf, c.float], [2.5, 3.75, 4.75, 6, 2.25]);
  assert.equal(result.totalFloat, 2.25);
  assert.ok(result.edges.filter((edge) => edge.from === 'C' || edge.to === 'C').every((edge) => !edge.critical));
});
test('topological sorting, multiple roots and terminals, zero durations', () => {
  const result = calculateCPM([activity('D', 0, ['B']), activity('B', 2, ['A', 'C']), activity('C', 0), activity('E', 1, ['B']), activity('A', 1)]);
  assert.equal(result.duration, 4);
  assert.deepEqual(result.criticalPaths, [['A', 'B', 'E']]);
  assert.equal(result.activities.find((a) => a.id === 'D').float, 1);
  assert.deepEqual(calculateCPM([activity('A', 0), activity('B', 0, ['A'])]).criticalPaths, [['A', 'B']]);
  assert.equal(calculateCPM([]).duration, 0);
});
test('binary floating arithmetic does not create false slack', () => {
  const result = calculateCPM([activity('A', 0.1), activity('B', 0.2, ['A']), activity('C', 0.3, ['B'])]);
  assert.equal(result.duration, 0.6);
  assert.equal(result.criticalActivities.length, 3);
});
test('critical nodes connected by a non-tight shortcut do not imply a critical edge', () => {
  const result = calculateCPM([activity('A', 1), activity('B', 1, ['A']), activity('C', 1, ['A', 'B'])]);
  assert.equal(result.edges.find((edge) => edge.from === 'A' && edge.to === 'C').critical, false);
  assert.deepEqual(result.criticalPaths, [['A', 'B', 'C']]);
});
test('reject invalid graphs with useful errors', () => {
  for (const [input, message] of [
    [[activity('A', 1), activity('A', 2)], /Duplicate activity/],
    [[activity('A', 1, ['missing'])], /does not exist/],
    [[activity('A', 1, ['B']), activity('B', 1, ['A'])], /Circular/],
    [[activity('A', 1, ['A'])], /Circular/],
    [[activity('A', -1)], /duration/],
    [[activity('A', Infinity)], /duration/],
    [[activity('A', '2')], /duration/],
    [[activity('A', 1), activity('B', 1)], /Disconnected/],
    [[activity('START', 1)], /reserved/],
    [[activity('A', 1), activity('B', 1, ['A', 'A'])], /duplicate predecessor/]
  ]) assert.throws(() => calculateCPM(input), message);
});
test('all critical paths are counted even when textual enumeration is bounded', () => {
  const input = [activity('root', 1)];
  let predecessors = ['root'];
  for (let i = 0; i < 11; i++) {
    input.push(activity(`a${i}`, 1, predecessors), activity(`b${i}`, 1, predecessors));
    predecessors = [`a${i}`, `b${i}`];
  }
  const result = calculateCPM(input);
  assert.equal(result.criticalPathCount, '2048');
  assert.equal(result.criticalPaths.length, 1000);
  assert.equal(result.pathsTruncated, true);
  assert.ok(result.edges.every((edge) => edge.critical));
});
test('assignment matches required skill, preserves assigned work, leaves unmatched work alone', () => {
  const members = [{ _id: '1', name: 'Arun', role: 'Developer', skills: ['React', 'Node.js', 'MongoDB'] }, { _id: '2', name: 'Maya', role: 'Designer', skills: ['Figma'] }];
  const input = [{ ...activity('A', 1), name: 'Build REST API', requiredSkills: ['Node.js'] }, { ...activity('B', 1), name: 'Create screen', requiredRole: 'Designer' }, { ...activity('C', 1), name: 'Unrelated' }, { ...activity('D', 1), assignedMember: '2' }];
  assert.deepEqual(suggestAssignments(input, members).map((a) => a.memberId), ['1', '2', null]);
  assert.deepEqual(suggestAssignments(input, members), suggestAssignments(input, members));
});
test('CSV/JSON team parsing supports quoted skills and rejects malformed files', () => {
  const parsed = parseMembers('name,email,role,skills\r\nArun,arun@example.com,Developer,"React,Node.js,MongoDB"\r\n', 'members.csv');
  assert.deepEqual(parsed[0].skills, ['React', 'Node.js', 'MongoDB']);
  assert.deepEqual(parseMembers(JSON.stringify(parsed), 'members.json'), parsed);
  assert.throws(() => parseMembers('name,role\nArun,Developer', 'bad.csv'), /headers/);
  assert.throws(() => parseMembers('name,email,role,skills\nArun,a@b.com,Developer,"Node.js', 'bad.csv'), /unclosed/);
  assert.throws(() => parseMembers('{}', 'bad.json'), /1–200/);
});
