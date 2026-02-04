const request = require("supertest");
const app = require("../service");

let testUser;
let testUserAuthToken;

beforeAll(async () => {
  testUser = createTestUserObject();
  const registerRes = await request(app).post("/api/auth").send(testUser);
  testUserAuthToken = registerRes.body.token;
});

test("register", async () => {
  const registerRes = await request(app)
    .post("/api/auth")
    .send(createTestUserObject());

  expect(registerRes.status).toBe(200);
  expectValidJwt(registerRes.body.token);
});

test("login", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  expect(loginRes.status).toBe(200);
  expectValidJwt(loginRes.body.token);

  const expectedUser = { ...testUser, roles: [{ role: "diner" }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);
});

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(
    /^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/,
  );
}

function createTestUserObject() {
  const name = Math.random().toString(36).substring(2, 12);
  return {
    name,
    email: `${name}@test.com`,
    password: Math.random().toString(36).substring(2, 12),
  };
}
