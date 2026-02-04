const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database");
const {
  createTestUserObject,
  registerTestUser,
} = require("../testUtils/authUtils");

let testUser;
let testUserAuthToken;
let franchise;

beforeAll(async () => {
  testUser = {
    ...createTestUserObject(),
    roles: [{ role: Role.Admin }],
  };
  testUser.id = (await DB.addUser(testUser)).id;
  testUserAuthToken = (await request(app).put("/api/auth").send(testUser)).body
    .token;
  franchise = (
    await createFranchise(createTestFranchiseObject(), testUserAuthToken)
  ).body;
});

test("list all franchises", async () => {
  const listRes = await request(app).get("/api/franchise").send();

  expect(listRes.status).toBe(200);
  expect(listRes.body).toMatchObject({});
  expect(Array.isArray(listRes.body.franchises)).toBe(true);
  expect(listRes.body.more).toBeDefined();
});

test("create franchise", async () => {
  const franchise = createTestFranchiseObject();
  const createRes = await createFranchise(franchise, testUserAuthToken);

  expect(createRes.status).toBe(200);
  expect(createRes.body.id).toBeDefined();
  expect(createRes.body.name).toEqual(franchise.name);
});

test("create franchise fails when user is not admin", async () => {
  let { testUserAuthToken } = await registerTestUser();
  const franchise = createTestFranchiseObject();
  franchise.admins = [{ email: testUser.email }];
  const createRes = await createFranchise(franchise, testUserAuthToken);

  expect(createRes.status).toBe(403);
  expect(createRes.body).toMatchObject({
    message: "unable to create a franchise",
  });
});

test("list user franchises", async () => {
  const listRes = await request(app)
    .get(`/api/franchise/${testUser.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send();

  expect(listRes.status).toBe(200);
  expect(listRes.body).toEqual(
    expect.arrayContaining([expect.objectContaining(franchise)]),
  );
});

test("delete franchise", async () => {
  const newFranchise = await createFranchise(
    createTestUserObject(),
    testUserAuthToken,
  );
  const deleteRes = await request(app)
    .delete(`/api/franchise/${newFranchise.id}`)
    .send();
  const listRes = await request(app)
    .get(`/api/franchise/${testUser.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send();

  expect(deleteRes.status).toBe(200);
  expect(deleteRes.body).toMatchObject({ message: "franchise deleted" });
  expect(listRes.body).not.toEqual(
    expect.arrayContaining([expect.objectContaining(newFranchise)]),
  );
});

function createTestFranchiseObject() {
  return {
    name: Math.random().toString(36).substring(2, 12),
    admins: [{ email: testUser.email }],
  };
}

async function createFranchise(franchise, authToken) {
  return await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${authToken}`)
    .send(franchise);
}
