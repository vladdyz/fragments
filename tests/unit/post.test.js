const { Fragment } = require('../../src/model/fragment');
const app = require('../../src/app');
const request = require('supertest');

describe('POST /fragments tests', () => {
  test('Unauthenticated users rejected', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .set('Content-Type', 'text/plain')
      .send('No auth test');
    expect(res.statusCode).toBe(401);
  });

  test('Successfully post a text fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('text');
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
  });

  test('Unsupported content type is rejected', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'application/exe')
      .send('test');
    expect(res.statusCode).toBe(415);
    expect(res.body.message).toBe('Invalid unsupported type');
  });

  test('Response includes all properties (id, ownerId, created, updated, size, type) with correct values', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This text has 27 characters');
    const fragment = res.body.fragment;
    expect(fragment).toHaveProperty('id');
    // ownerId is now hashed using SHA256 instead of plain text ('testaccount1@email.com')
    expect(fragment).toHaveProperty(
      'ownerId',
      '494e409b86dd092cbb928c8b8a41d36310d426c25644cb27263d62329a4d3f5a'
    );
    expect(fragment).toHaveProperty('type', 'text/plain');
    expect(fragment).toHaveProperty('size', 27);
    expect(fragment).toHaveProperty('created');
    expect(fragment).toHaveProperty('updated');
  });

  test('POST response includes a Location header with a full URL to GET the created fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('I love coffee');
    const fragment = res.body.fragment;
    expect(res.headers.location).toMatch(new RegExp(`/v1/fragments/${fragment.id}$`));
  });

  test('Confirm that a fragment was actually posted', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Hello World');
    const fragment = res.body.fragment;
    const isSaved = await Fragment.byId(fragment.ownerId, fragment.id);
    expect(isSaved).toBeDefined();
    expect(isSaved.isText).toBe(true);
    expect(isSaved.size).toBe(11);
  });

  test('Invalid users rejected', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('incog@email.com', 'nito')
      .set('Content-Type', 'text/plain')
      .send('No auth test');
    expect(res.statusCode).toBe(401);
  });

  test('Posted fragment exceeds 5MB limit and is rejected', async () => {
    // the size can't be set manually so a payload exceeding 5MB must actually be created
    const reallyBigString = 'A'.repeat(5 * 1024 * 1024 + 1);
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(reallyBigString);
    expect(res.statusCode).toBe(413);
  });

  test('Post a Markdown fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('Hello World');
    const fragment = res.body.fragment;
    const isSaved = await Fragment.byId(fragment.ownerId, fragment.id);
    expect(isSaved).toBeDefined();
    expect(isSaved.isText).toBe(true);
    expect(isSaved.size).toBe(11);
    expect(isSaved.type).toBe('text/markdown');
  });

  test('Post HTML fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send('Hello World');
    const fragment = res.body.fragment;
    const isSaved = await Fragment.byId(fragment.ownerId, fragment.id);
    expect(isSaved).toBeDefined();
    expect(isSaved.isText).toBe(true);
    expect(isSaved.size).toBe(11);
    expect(isSaved.type).toBe('text/html');
  });

  test('A JSON fragment should not be a text fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send('Hello World');
    const fragment = res.body.fragment;
    const isSaved = await Fragment.byId(fragment.ownerId, fragment.id);
    expect(isSaved).toBeDefined();
    expect(isSaved.isText).toBe(false);
    expect(isSaved.size).toBe(11);
    expect(isSaved.type).toBe('application/json');
  });
});
