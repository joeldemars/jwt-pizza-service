const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database");
const {
  createTestUserObject,
  registerTestUser,
} = require("../testUtils/authUtils");

let testUser;
let testUserAuthToken;

beforeAll(async () => {
  testUser = {
    ...createTestUserObject(),
    roles: [{ role: Role.Admin }],
  };
  testUser.id = (await DB.addUser(testUser)).id;
  testUserAuthToken = (await request(app).put("/api/auth").send(testUser)).body
    .token;
});

test("list all franchises", async () => {
  const listRes = await request(app).get("/api/franchise").send();

  expect(listRes.status).toBe(200);
  expect(listRes.body).toMatchObject({});
  expect(Array.isArray(listRes.body.franchises)).toBe(true);
  expect(listRes.body.more).toBeDefined();
});

test("create franchise", async () => {
  const franchise = {
    name: createRandomName(),
    admins: [{ email: testUser.email }],
  };
  const createRes = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(franchise);

  expect(createRes.status).toBe(200);
  expect(createRes.body.id).toBeDefined();
  expect(createRes.body.name).toEqual(franchise.name);
});

test("create franchise fails when user is not admin", async () => {
  let { testUser, testUserAuthToken } = await registerTestUser();
  const franchise = {
    name: createRandomName(),
    admins: [{ email: testUser.email }],
  };
  const createRes = await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(franchise);

  expect(createRes.status).toBe(403);
  expect(createRes.body).toMatchObject({
    message: "unable to create a franchise",
  });
});

function createRandomName() {
  return Math.random().toString(36).substring(2, 12);
}
