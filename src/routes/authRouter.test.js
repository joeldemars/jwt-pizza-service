const request = require("supertest");
const app = require("../service");

let testUser;
let testUserAuthToken;

beforeEach(async () => {
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

test("register fails with no password", async () => {
  const invalidUser = { ...testUser };
  delete invalidUser.password;
  const registerRes = await request(app).post("/api/auth").send();

  expect(registerRes.status).toBe(400);
  expect(registerRes.body).toMatchObject({
    message: "name, email, and password are required",
  });
});

test("login", async () => {
  const loginRes = await request(app).put("/api/auth").send(testUser);
  expect(loginRes.status).toBe(200);
  expectValidJwt(loginRes.body.token);

  const expectedUser = { ...testUser, roles: [{ role: "diner" }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);
});

test("login fails with incorrect password", async () => {
  const invalidUser = {
    ...testUser,
    password: "invalidPassword",
  };
  const loginRes = await request(app).put("/api/auth").send(invalidUser);

  expect(loginRes.status).toBe(404);
  expect(loginRes.body).toMatchObject({ message: "unknown user" });
});

test("logout", async () => {
  const logoutRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send();

  expect(logoutRes.status).toBe(200);
  expect(logoutRes.body).toMatchObject({ message: "logout successful" });
});

test("logout fails when already logged out", async () => {
  await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send();
  const logoutRes = await request(app)
    .delete("/api/auth")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send();

  expect(logoutRes.status).toBe(401);
  expect(logoutRes.body).toMatchObject({ message: "unauthorized" });
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
