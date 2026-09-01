import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('GET /api/health returns an API status response', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: 'ok', service: 'ProdPilot API' });
});

test('unknown routes return a useful JSON 404 response', async () => {
  const response = await request(app).get('/api/missing');
  assert.equal(response.status, 404);
  assert.match(response.body.message, /not found/);
});
