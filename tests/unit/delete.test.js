const request = require('supertest');
const app = require('../../src/app');

describe('DELETE /v1/fragments/:id unit tests', () => {
  test('Successfully delete an existing fragment', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('hello');
    const id = postRes.body.fragment.id;
    const delRes = await request(app)
      .delete(`/v1/fragments/${id}`)
      .auth('testaccount1@email.com', 'password1');

    expect(delRes.statusCode).toBe(200);
    expect(delRes.body.status).toBe('ok');
  });

  test('Cannot delete another users fragment', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('not yours');

    const id = postRes.body.fragment.id;

    const delRes = await request(app)
      .delete(`/v1/fragments/${id}`)
      .auth('kittens@email.com', 'drowssap');

    expect(delRes.statusCode).toBe(404);
  });

  test('Delete non-existent fragment returns 404', async () => {
    const delRes = await request(app)
      .delete('/v1/fragments/does-not-exist')
      .auth('testaccount1@email.com', 'password1');

    expect(delRes.statusCode).toBe(404);
  });
});
