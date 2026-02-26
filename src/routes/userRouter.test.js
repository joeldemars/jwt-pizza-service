const request = require("supertest");
const app = require("../service");
const { registerTestUser } = require("../testUtils/authUtils");

test('list users unauthorized', async () => {
  const listUsersRes = await request(app).get('/api/user');
  expect(listUsersRes.status).toBe(401);
});

test('list users', async () => {
  const { testUser, testUserAuthToken } = await registerTestUser();
  const listUsersRes = await request(app)
    .get('/api/user')
    .set('Authorization', 'Bearer ' + testUserAuthToken);
  
  expect(listUsersRes.status).toBe(200);
  expect(listUsersRes.body).toHaveProperty("users");
  expect(listUsersRes.body.users.length).toBeGreaterThan(0);
});
