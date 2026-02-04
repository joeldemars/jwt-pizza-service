const request = require("supertest");
const app = require("../service");
const { registerTestUser } = require("../testUtils/authUtils");

let testUser;
let testUserAuthToken;

beforeAll(async () => {
  ({ testUser, testUserAuthToken } = await registerTestUser());
});

test("list all franchises", async () => {
  const listRes = await request(app).get("/api/franchise").send();

  expect(listRes.status).toBe(200);
  expect(listRes.body).toMatchObject({});
  expect(Array.isArray(listRes.body.franchises)).toBe(true);
  expect(listRes.body.more).toBeDefined();
});
