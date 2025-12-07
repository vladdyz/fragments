const request = require('supertest');
const app = require('../../src/app');

describe('PUT /v1/fragments/:id unit tests', () => {
  test('Successfully replace a fragment you own', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('original text');

    const id = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('updated text');

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.status).toBe('ok');
    expect(putRes.body.fragment.size).toBe(12); // "updated text"
  });

  test('Cannot replace another users fragment', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('you do not own this');

    const id = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('kittens@email.com', 'drowssap')
      .set('Content-Type', 'text/plain')
      .send('attempt replace');

    expect(putRes.statusCode).toBe(404);
  });

  test('Cannot replace a non-existent fragment', async () => {
    const putRes = await request(app)
      .put('/v1/fragments/does-not-exist')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('text');

    expect(putRes.statusCode).toBe(404);
  });

  test('Cannot replace with unsupported content type', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('supported');

    const id = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'application/exe')
      .send('unsupported');

    expect(putRes.statusCode).toBe(415);
    expect(putRes.body.error.message).toBe('Invalid unsupported type');
  });
  test('Content type mismatch should throw an error', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('supported');

    const id = postRes.body.fragment.id;

    const putRes = await request(app)
      .put(`/v1/fragments/${id}`)
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send('unsupported');

    expect(putRes.statusCode).toBe(400);
  });
});
