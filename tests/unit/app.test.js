const request = require('supertest');

const app = require('../../src/app');

// A simple test to confirm that the 404 middleware correctly recognizes a non-existent route being accessed
describe('404 Middleware Test', () => {
  test('Accessing invalid route should return 404', async () => {
    const res = await request(app).get('/invalid');
    expect(res.statusCode).toBe(404);
  });
});
