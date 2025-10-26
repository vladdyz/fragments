const request = require('supertest');

const app = require('../../src/app');

const { deleteFragment } = require('../../src/model/data/memory/index');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('testaccount1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  // TODO: we'll need to add tests to check the contents of the fragments array later
});

describe('GET /v1/fragments/:id', () => {
  // Return a specific fragment by its id
  test('Return an existing fragment created by the current user through its ID', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('I love coffee');
    const fragment = res.body.fragment;
    const req = await request(app)
      .get(`/v1/fragments/${fragment.id}`)
      .auth('testaccount1@email.com', 'password1');
    expect(req.statusCode).toBe(200);
  });
  // a different user should not be able to retrieve this specific fragment
  test('Attempting to return an existing fragment created by a different user through its ID should fail', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('I love coffee');
    const fragment = res.body.fragment;
    const req = await request(app)
      .get(`/v1/fragments/${fragment.id}`)
      .auth('kittens@email.com', 'drowssap');
    expect(req.statusCode).toBe(404);
  });
  test('Attempting to return an existing fragment by an unauthorized user should fail', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('I love coffee');
    const fragment = res.body.fragment;
    const req = await request(app)
      .get(`/v1/fragments/${fragment.id}`)
      .auth('invalidaccount@email.com', '123');
    expect(req.statusCode).toBe(401);
  });
  test('Attempting to return a nonexistent fragment by an authenticated user should return 404 Not Found', async () => {
    const missing = 'notARealFragment';
    const res = await request(app)
      .get(`/v1/fragments/${missing}`)
      .auth('kittens@email.com', 'drowssap');
    expect(res.statusCode).toBe(404);
  });
  test('Attempting to return a deleted fragment by an authenticated user should return 404 Not Found', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('I love coffee');
    const fragment = res.body.fragment;
    // commenting this out returns 200 instead of 404, supporting the actual removal of the fragment
    await deleteFragment(fragment.ownerId, fragment.id);
    const req = await request(app)
      .get(`/v1/fragments/${fragment.id}`)
      .auth('testaccount1@email.com', 'password1');
    expect(req.statusCode).toBe(404);
  });
});
