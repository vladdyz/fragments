const request = require('supertest');

const app = require('../../src/app');

// A simple test to confirm that the 404 middleware correctly recognizes a non-existent route being accessed
describe('404 Middleware Test', () => {
  test('Accessing invalid route should return 404', async () => {
    const res = await request(app).get('/invalid');
    expect(res.statusCode).toBe(404);
  });
});

describe('Valid route', () => {
  test('Accessing valid route should return 200', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
  });
});

describe('Auth test', () => {
  test('Accessing secured route should return unauthorized', async () => {
    const res = await request(app).get('/v1/fragments');
    expect(res.statusCode).toBe(401);
  });
});
