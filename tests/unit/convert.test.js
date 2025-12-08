const request = require('supertest');
const app = require('../../src/app');
const { Fragment } = require('../../src/model/fragment');
const fs = require('fs');
const path = require('path');

describe('Image conversion tests', () => {
  const imgPath = path.join(__dirname, '../integration/test-image.png');
  const imgBuffer = fs.readFileSync(imgPath);

  test('Upload a PNG image fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(imgBuffer);

    expect(res.statusCode).toBe(201);
    expect(res.body.fragment.type).toBe('image/png');
    const fragment = res.body.fragment;
    const saved = await Fragment.byId(fragment.ownerId, fragment.id);

    expect(saved).toBeDefined();
    expect(saved.type.startsWith('image/')).toBe(true);
  });

  test('Reject unsupported image formats', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'image/tiff')
      .send('fake');

    expect(res.statusCode).toBe(415);
  });

  test('Convert PNG to JPG', async () => {
    // Upload original PNG
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(imgBuffer);

    const id = res.body.fragment.id;

    // Request conversion
    const converted = await request(app)
      .get(`/v1/fragments/${id}.jpg`)
      .auth('testaccount1@email.com', 'password1');

    expect(converted.statusCode).toBe(200);
    expect(converted.headers['content-type']).toBe('image/jpeg');
    expect(converted.body.length).toBeGreaterThan(0);
  });

  test('Convert PNG to WebP', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(imgBuffer);

    const id = res.body.fragment.id;

    const converted = await request(app)
      .get(`/v1/fragments/${id}.webp`)
      .auth('testaccount1@email.com', 'password1');

    expect(converted.statusCode).toBe(200);
    expect(converted.headers['content-type']).toBe('image/webp');
  });

  test('Convert PNG to GIF', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(imgBuffer);

    const id = res.body.fragment.id;

    const converted = await request(app)
      .get(`/v1/fragments/${id}.gif`)
      .auth('testaccount1@email.com', 'password1');

    expect(converted.statusCode).toBe(200);
  });

  test('Convert PNG to AVIF', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(imgBuffer);

    const id = res.body.fragment.id;

    const converted = await request(app)
      .get(`/v1/fragments/${id}.avif`)
      .auth('testaccount1@email.com', 'password1');

    expect(converted.statusCode).toBe(200);
  });

  test('Unauthorized user cannot convert another users image fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(imgBuffer);

    const id = res.body.fragment.id;

    const converted = await request(app)
      .get(`/v1/fragments/${id}.jpg`)
      .auth('kittens@email.com', 'drowssap');

    expect(converted.statusCode).toBe(404);
  });
  test('Attempting unsupported conversion returns 415', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(imgBuffer);

    const id = res.body.fragment.id;

    const converted = await request(app)
      .get(`/v1/fragments/${id}.doc`)
      .auth('testaccount1@email.com', 'password1');

    expect(converted.statusCode).toBe(415);
  });
});

describe('Application (JSON/YAML) tests', () => {
  test('Convert JSON to YML', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send('{"text": "example"}');
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');

    const id = res.body.fragment.id;

    const converted = await request(app)
      .get(`/v1/fragments/${id}.yaml`)
      .auth('testaccount1@email.com', 'password1');

    expect(converted.statusCode).toBe(200);
    expect(converted.headers['content-type']).toBe('application/yaml; charset=utf-8');
  });

  test('Convert YML to JSON', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'application/yaml')
      .send('text');
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');

    const id = res.body.fragment.id;

    const converted = await request(app)
      .get(`/v1/fragments/${id}.json`)
      .auth('testaccount1@email.com', 'password1');

    expect(converted.statusCode).toBe(200);
    expect(converted.headers['content-type']).toBe('application/json; charset=utf-8');
  });
  test('Convert YML to unsupported type (Markdown) should return the original fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'application/yaml')
      .send('text');
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');

    const id = res.body.fragment.id;

    const converted = await request(app)
      .get(`/v1/fragments/${id}.md`)
      .auth('testaccount1@email.com', 'password1');

    expect(converted.statusCode).toBe(200);
    expect(converted.headers['content-type']).toBe('application/yaml');
  });
});

describe('CSV conversions (json, txt & csv)', () => {
  const csvPath = path.join(__dirname, '../integration/test.csv');
  const csvBuffer = fs.readFileSync(csvPath);
  test('Convert CSV to JSON', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send(csvBuffer);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');

    const id = res.body.fragment.id;

    const converted = await request(app)
      .get(`/v1/fragments/${id}.json`)
      .auth('testaccount1@email.com', 'password1');

    expect(converted.statusCode).toBe(200);
    expect(converted.headers['content-type']).toBe('application/json; charset=utf-8');
  });

  test('Convert CSV to text', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send(csvBuffer);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');

    const id = res.body.fragment.id;

    const converted = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('testaccount1@email.com', 'password1');

    expect(converted.statusCode).toBe(200);
    expect(converted.headers['content-type']).toBe('text/plain; charset=utf-8');
  });
  test('Convert CSV to itself should return the original csv', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send(csvBuffer);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');

    const id = res.body.fragment.id;

    const converted = await request(app)
      .get(`/v1/fragments/${id}.csv`)
      .auth('testaccount1@email.com', 'password1');

    expect(converted.statusCode).toBe(200);
    expect(converted.headers['content-type']).toBe('text/csv; charset=utf-8');
  });
  test('Convert CSV to unsupported type should return the original fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('testaccount1@email.com', 'password1')
      .set('Content-Type', 'text/csv')
      .send(csvBuffer);
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');

    const id = res.body.fragment.id;

    const converted = await request(app)
      .get(`/v1/fragments/${id}.png`)
      .auth('testaccount1@email.com', 'password1');

    expect(converted.statusCode).toBe(200);
    expect(converted.headers['content-type']).toBe('text/csv; charset=utf-8');
  });
});
