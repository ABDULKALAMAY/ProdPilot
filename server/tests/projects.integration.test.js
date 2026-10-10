import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../src/app.js';

// Opt in to a real MongoDB. All fixtures live in a unique disposable database.
test('authenticated project workflow and existing API regression', { skip: !process.env.TEST_MONGO_URI }, async (t) => {
  process.env.JWT_SECRET = 'prodpilot-test-only-secret';
  const database = `prodpilot_test_${randomUUID().replaceAll('-', '')}`;
  await mongoose.connect(process.env.TEST_MONGO_URI, { dbName: database });
  const send = (method, path, token, body) => request(app)[method](path).set('Authorization', `Bearer ${token}`).send(body);
  let owner, outsider, viewer, manager, project, member;
  try {
    await t.test('register and existing login still work', async () => {
      for (const name of ['Owner', 'Outsider', 'Viewer', 'Manager']) {
        const result = await request(app).post('/api/auth/register').send({ name, email: `${name.toLowerCase()}@example.com`, password: 'test-password-123' });
        assert.equal(result.status, 201, JSON.stringify(result.body));
        if (name === 'Owner') owner = result.body.token;
        if (name === 'Outsider') outsider = result.body.token;
        if (name === 'Viewer') viewer = result.body.token;
        if (name === 'Manager') manager = result.body.token;
      }
      const login = await request(app).post('/api/auth/login').send({ email: 'owner@example.com', password: 'test-password-123' });
      assert.equal(login.status, 200);
      owner = login.body.token;
      assert.equal((await request(app).post('/api/auth/login').send({ email: 'owner@example.com', password: 'wrong-password' })).status, 401);
    });
    await t.test('create/edit/list a project with authenticated ownership', async () => {
      assert.equal((await request(app).get('/api/projects')).status, 401);
      const response = await send('post', '/api/projects', owner, { name: 'CPM test', description: 'Planning', startDate: '2026-09-21', owner: 'ignored' });
      assert.equal(response.status, 201, JSON.stringify(response.body));
      project = response.body.project;
      assert.equal(response.body.canManage, true);
      const edit = await send('put', `/api/projects/${project._id}`, owner, { name: 'CPM material' });
      assert.equal(edit.status, 200);
      assert.equal(edit.body.project.name, 'CPM material');
      assert.equal((await send('get', '/api/projects', outsider)).body.projects.length, 0);
      assert.equal((await send('get', `/api/projects/${project._id}`, outsider)).status, 404);
      assert.equal((await send('put', `/api/projects/${project._id}`, outsider, { name: 'Intrusion' })).status, 404);
    });
    await t.test('add activities/predecessors and get both critical paths', async () => {
      for (const [id, duration, predecessors] of [['A', 4, []], ['B', 3, ['A']], ['C', 6, ['A']], ['D', 5, ['B']], ['E', 2, ['C']], ['F', 4, ['D', 'E']]]) {
        const response = await send('post', `/api/projects/${project._id}/activities`, owner, { id, name: id === 'A' ? 'Build REST API' : id, duration, predecessors, requiredSkills: id === 'A' ? ['Node.js'] : [] });
        assert.equal(response.status, 200, JSON.stringify(response.body));
      }
      const { body } = await send('get', `/api/projects/${project._id}`, owner);
      assert.equal(body.cpm.duration, 16);
      assert.deepEqual(body.cpm.criticalPaths, [['A', 'B', 'D', 'F'], ['A', 'C', 'E', 'F']]);
      assert.ok(body.cpm.edges.every((edge) => edge.critical));
    });
    await t.test('team import, read-only member, manager and cross-project authorization', async () => {
      const response = await send('post', `/api/projects/${project._id}/members`, owner, { members: [
        { name: 'Arun', email: 'arun@example.com', role: 'Developer', skills: ['React', 'Node.js', 'MongoDB'] },
        { name: 'Viewer', email: 'viewer@example.com', role: 'Tester', skills: ['Testing'] },
        { name: 'Manager', email: 'manager@example.com', role: 'Project Manager', skills: [] }
      ] });
      assert.equal(response.status, 200, JSON.stringify(response.body));
      member = response.body.project.members[0];
      assert.equal((await send('get', `/api/projects/${project._id}`, viewer)).body.canManage, false);
      assert.equal((await send('post', `/api/projects/${project._id}/activities`, viewer, {})).status, 403);
      assert.equal((await send('put', `/api/projects/${project._id}`, manager, { description: 'Manager edited' })).status, 200);
      assert.equal((await send('post', `/api/projects/${project._id}/auto-assign`, outsider)).status, 404);
      assert.equal((await send('delete', `/api/projects/${project._id}/members/${member._id}`, outsider)).status, 404);
      assert.equal((await send('delete', `/api/projects/${project._id}`, manager)).status, 403);
    });
    await t.test('auto assignment is a preview, manual review and assignment persist', async () => {
      const preview = await send('post', `/api/projects/${project._id}/auto-assign`, owner);
      const suggestion = preview.body.suggestions.find((item) => item.activityId === 'A');
      assert.equal(suggestion.memberId, member._id);
      assert.equal((await send('get', `/api/projects/${project._id}`, owner)).body.project.activities[0].assignedMember, null);
      const applied = await send('put', `/api/projects/${project._id}/assignments`, owner, { assignments: [{ activityId: 'A', memberId: member._id }] });
      assert.equal(applied.status, 200);
      assert.equal(applied.body.project.activities[0].assignedMember, member._id);
      const manual = await send('put', `/api/projects/${project._id}/activities/B`, owner, { assignedMember: member._id, status: 'in-progress' });
      assert.equal(manual.status, 200);
      assert.equal(manual.body.project.activities[1].assignedMember, member._id);
      assert.equal((await send('put', `/api/projects/${project._id}/activities/B`, owner, { assignedMember: new mongoose.Types.ObjectId().toString() })).status, 400);
    });
    await t.test('reject circular, duplicate, disconnected, missing, negative and date-invalid activities without saving', async () => {
      for (const [method, suffix, body] of [
        ['put', '/A', { predecessors: ['F'] }], ['post', '', { id: 'A', name: 'duplicate', duration: 1, predecessors: [] }],
        ['post', '', { id: 'X', name: 'missing', duration: 1, predecessors: ['missing'] }],
        ['post', '', { id: 'X', name: 'disconnected', duration: 1, predecessors: [] }],
        ['put', '/B', { duration: -1 }], ['put', '/B', { duration: '2' }],
        ['put', '/B', { startDate: '2026-10-02', endDate: '2026-10-01' }]
      ]) assert.equal((await send(method, `/api/projects/${project._id}/activities${suffix}`, owner, body)).status, 400);
      assert.equal((await send('get', `/api/projects/${project._id}`, owner)).body.cpm.duration, 16);
      assert.equal((await send('delete', `/api/projects/${project._id}/activities/A`, owner)).status, 400);
    });
    await t.test('decimal network replacement, activity edit/delete and member removal', async () => {
      const activities = [['A', 2.5, []], ['B', 3.5, ['A']], ['C', 1.25, ['A']], ['D', 2.75, ['B', 'C']]].map(([id, duration, predecessors]) => ({ id, name: id, duration, predecessors }));
      const result = await send('put', `/api/projects/${project._id}/activities`, owner, { activities });
      assert.equal(result.status, 200);
      assert.equal(result.body.cpm.duration, 8.75);
      assert.equal(result.body.cpm.activities.find((a) => a.id === 'C').float, 2.25);
      assert.equal((await send('put', `/api/projects/${project._id}/activities/A`, owner, { assignedMember: member._id })).status, 200);
      assert.equal((await send('delete', `/api/projects/${project._id}/activities/D`, owner)).status, 200);
      const removal = await send('delete', `/api/projects/${project._id}/members/${member._id}`, owner);
      assert.equal(removal.status, 200);
      assert.equal(removal.body.project.activities[0].assignedMember, null);
    });
    await t.test('existing My Tasks and Dashboard data operations still work', async () => {
      const created = await send('post', '/api/tasks', owner, { title: 'Regression task', priority: 'high' });
      assert.equal(created.status, 201);
      const task = created.body.task;
      assert.equal((await send('get', '/api/tasks', owner)).body.tasks.length, 1);
      assert.equal((await send('get', '/api/tasks', outsider)).body.tasks.length, 0);
      const completed = await send('put', `/api/tasks/${task._id}`, owner, { completed: true });
      assert.equal(completed.body.task.completed, true);
      assert.equal((await send('get', '/api/tasks?status=completed', owner)).body.tasks.length, 1);
      assert.equal((await send('delete', `/api/tasks/${task._id}`, owner)).status, 204);
    });
    await t.test('owner can delete their project', async () => {
      assert.equal((await send('delete', `/api/projects/${project._id}`, owner)).status, 204);
      assert.equal((await send('get', `/api/projects/${project._id}`, owner)).status, 404);
    });
  } finally {
    if (mongoose.connection.name === database && database.startsWith('prodpilot_test_')) await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
