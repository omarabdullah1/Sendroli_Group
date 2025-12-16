const request = require('supertest');
const app = require('../server');

describe('Orders Timeseries API', () => {
  test('GET /api/orders/stats/timeseries should return 401 without auth', async () => {
    const res = await request(app).get('/api/orders/stats/timeseries');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/orders/stats/timeseries with interval should return 401 without auth', async () => {
    const r1 = await request(app).get('/api/orders/stats/timeseries?period=12&interval=week');
    expect(r1.statusCode).toBe(401);
    const r2 = await request(app).get('/api/orders/stats/timeseries?period=6&interval=month');
    expect(r2.statusCode).toBe(401);
  });

  // Optional: If you want to run with a seeded DB and an admin token, use the following test
  // Un-comment to perform a full validation (requires a running server with seeded users)
  // test('GET /api/orders/stats/timeseries with invalid interval should return 400', async () => {
  //   // Login step
  //   const login = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' });
  //   expect(login.statusCode).toBe(200);
  //   const token = login.body.token;
  //   const res = await request(app).get('/api/orders/stats/timeseries?interval=yearly').set('Authorization', `Bearer ${token}`);
  //   expect(res.statusCode).toBe(400);
  // });

  // Optional: Run with a seeded DB to verify output shape
  // test('GET /api/orders/stats/timeseries returns valid shape for day/week/month with auth', async () => {
  //   const login = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'admin123' });
  //   expect(login.statusCode).toBe(200);
  //   const token = login.body.token;
  //   const rDay = await request(app).get('/api/orders/stats/timeseries?period=7&interval=day').set('Authorization', `Bearer ${token}`);
  //   expect(rDay.statusCode).toBe(200);
  //   expect(rDay.body.success).toBe(true);
  //   expect(Array.isArray(rDay.body.data.labels)).toBe(true);
  //   expect(rDay.body.data.labels.length).toBe(7);

  //   const rWeek = await request(app).get('/api/orders/stats/timeseries?period=6&interval=week').set('Authorization', `Bearer ${token}`);
  //   expect(rWeek.statusCode).toBe(200);
  //   expect(rWeek.body.success).toBe(true);
  //   expect(Array.isArray(rWeek.body.data.labels)).toBe(true);
  //   expect(rWeek.body.data.labels.length).toBe(6);

  //   const rMonth = await request(app).get('/api/orders/stats/timeseries?period=6&interval=month').set('Authorization', `Bearer ${token}`);
  //   expect(rMonth.statusCode).toBe(200);
  //   expect(rMonth.body.success).toBe(true);
  //   expect(Array.isArray(rMonth.body.data.labels)).toBe(true);
  //   expect(rMonth.body.data.labels.length).toBe(6);
  // });

  // NOTE: For a full test, run against a seeded test DB and include a login step to acquire a token.
  // Example (pseudo code):
  // const login = await request(app).post('/api/auth/login').send({username: 'admin', password: 'admin123'});
  // const token = login.body.token;
  // const res = await request(app).get('/api/orders/stats/timeseries?period=7').set('Authorization', `Bearer ${token}`);
  // expect(res.statusCode).toBe(200);
  // expect(res.body.data).toHaveProperty('labels');
  // expect(Array.isArray(res.body.data.labels)).toBe(true);
});
