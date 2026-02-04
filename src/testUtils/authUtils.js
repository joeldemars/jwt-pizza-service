const request = require("supertest");
const app = require("../service");

function createTestUserObject() {
  const name = Math.random().toString(36).substring(2, 12);
  return {
    name,
    email: `${name}@test.com`,
    password: Math.random().toString(36).substring(2, 12),
  };
}

async function registerTestUser() {
  const testUser = createTestUserObject();
  const registerRes = await request(app).post("/api/auth").send(testUser);
  return {
    testUser,
    testUserAuthToken: registerRes.body.token,
  };
}

module.exports = {
  createTestUserObject,
  registerTestUser,
};
