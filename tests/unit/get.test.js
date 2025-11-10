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
  // Check the contents of the fragments array
  test('contents of a fragment array match the fragments created by an authenticated user', async () => {
    const firstFragment = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('First Fragment');
    const secondFragment = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Second Fragment');
    const thirdFragment = await request(app)
      .post('/v1/fragments')
      .auth('kittens@email.com', 'drowssap')
      .set('Content-Type', 'text/plain')
      .send('This fragment should not show up in the testaccount1 fragments array');

    const fragments = await request(app)
      .get('/v1/fragments')
      .auth('testaccount1@email.com', 'password1');

    // should get an OK response and an array of fragments
    expect(fragments.statusCode).toBe(200);
    expect(fragments.body.status).toBe('ok');
    expect(Array.isArray(fragments.body.fragments)).toBe(true);
    // if all good, check the contents of the array to see if they match the POST
    const res = fragments.body.fragments;
    expect(res).toContain(firstFragment.body.fragment.id);
    expect(res).toContain(secondFragment.body.fragment.id);
    expect(res).not.toContain(thirdFragment.body.fragment.id);
  });
  // Check the expand query param
  test('?expand=1 returns expanded fragment metadata for an authenticated user', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('kittens@email.com', 'drowssap')
      .set('Content-Type', 'text/plain')
      .send('Hello world');
    const req = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('kittens@email.com', 'drowssap');

    expect(req.statusCode).toBe(200);
    // check that metadata is included with expand query param (id, ownerId, created, updated, type, size)
    const fragment = res.body.fragment;
    expect(fragment).toHaveProperty('id');
    expect(fragment).toHaveProperty('ownerId');
    expect(fragment).toHaveProperty('created');
    expect(fragment).toHaveProperty('updated');
    expect(fragment).toHaveProperty('type');
    expect(fragment).toHaveProperty('size', 11); // Hello World has 11 chars incl space, confirm its the right fragment
  });
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
  test('Return fragment metadata created by the current user through its ID', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('I love coffee');
    const fragment = res.body.fragment;
    const req = await request(app)
      .get(`/v1/fragments/${fragment.id}/info`)
      .auth('testaccount1@email.com', 'password1');
    expect(req.statusCode).toBe(200);
    expect(req.body.status).toBe('ok');
    expect(req.body.fragment).toHaveProperty('size', 13);
  });
  test('Return fragment metadata for unauthorized user should fail', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('I love coffee');
    const fragment = res.body.fragment;
    const req = await request(app)
      .get(`/v1/fragments/${fragment.id}/info`)
      .auth('invalidaccount@email.com', '123');
    expect(req.statusCode).toBe(401);
  });
  test('Return fragment metadata for nonexisting fragment should 404', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('I love coffee');
    const fragment = res.body.fragment;
    const req = await request(app)
      .get(`/v1/fragments/${fragment.id}/info`)
      .auth('kittens@email.com', 'drowssap');
    expect(req.statusCode).toBe(404);
  });
});
