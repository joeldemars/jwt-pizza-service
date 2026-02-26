const request = require("supertest");
const app = require("../service");
const { registerTestUser } = require("../testUtils/authUtils");

test('list users unauthorized', async () => {
  const listUsersRes = await request(app).get('/api/user');
  expect(listUsersRes.status).toBe(401);
});

test('list users', async () => {
  const { testUserAuthToken } = await registerTestUser();
  const listUsersRes = await request(app)
    .get('/api/user')
    .set('Authorization', 'Bearer ' + testUserAuthToken);
  
  expect(listUsersRes.status).toBe(200);
  expect(listUsersRes.body).toHaveProperty("users");
  expect(listUsersRes.body.users.length).toBeGreaterThan(0);
});

test('list self', async () => {
  const { testUser, testUserAuthToken } = await registerTestUser();
  const listUsersRes = await request(app)
    .get(`/api/user?name=${testUser.name}`)
    .set('Authorization', 'Bearer ' + testUserAuthToken);
  const me = (await request(app)
    .get('/api/user/me')
    .set('Authorization', 'Bearer ' + testUserAuthToken)
    ).body;
  delete me.iat;
  
  expect(listUsersRes.status).toBe(200);
  expect(listUsersRes.body.users.length).toBe(1);
  expect(listUsersRes.body.users[0]).toMatchObject(me);
});

test('pagination', async () => {
  await registerTestUser();
  const { testUserAuthToken } = await registerTestUser();
  const page1Res = await request(app)
    .get('/api/user?page=1&limit=1')
    .set('Authorization', 'Bearer ' + testUserAuthToken);
  const page2Res = await request(app)
    .get('/api/user?page=2&limit=1')
    .set('Authorization', 'Bearer ' + testUserAuthToken);
  
  expect(page1Res.status).toBe(200);
  expect(page2Res.status).toBe(200);
  expect(page1Res.body.users.length).toBe(1);
  expect(page2Res.body.users.length).toBe(1);
  expect(page1Res.body.more).toBe(true);
  expect(page1Res.body.users[0]).not.toMatchObject(page2Res.body.users[0]);
});
