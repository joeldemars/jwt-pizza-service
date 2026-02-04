const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database");
const {
  createTestUserObject,
  registerTestUser,
} = require("../testUtils/authUtils");
const {
  createFranchise,
  createTestFranchiseObject,
  createNewStoreObject,
} = require("../testUtils/franchiseUtils");

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
    await createFranchise(
      createTestFranchiseObject(testUser),
      testUserAuthToken,
    )
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
  const franchise = createTestFranchiseObject(testUser);
  const createRes = await createFranchise(franchise, testUserAuthToken);

  expect(createRes.status).toBe(200);
  expect(createRes.body.id).toBeDefined();
  expect(createRes.body.name).toEqual(franchise.name);
});

test("create franchise fails when user is not admin", async () => {
  let { testUserAuthToken } = await registerTestUser();
  const franchise = createTestFranchiseObject(testUser);
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

test("create franchise store", async () => {
  const newStore = createNewStoreObject(franchise);
  const createRes = await request(app)
    .post(`/api/franchise/${franchise.id}/store`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(newStore);

  expect(createRes.status).toBe(200);
  expect(createRes.body.id).toBeDefined();
  expect(createRes.body.name).toEqual(newStore.name);
});

test("delete franchise store", async () => {
  const newStore = (
    await request(app)
      .post(`/api/franchise/${franchise.id}/store`)
      .set("Authorization", `Bearer ${testUserAuthToken}`)
      .send(createNewStoreObject(franchise))
  ).body;
  const count = (
    await request(app)
      .get(`/api/franchise/${testUser.id}`)
      .set("Authorization", `Bearer ${testUserAuthToken}`)
      .send()
  ).body.find((f) => f.name == franchise.name).stores.length;
  const deleteRes = await request(app)
    .delete(`/api/franchise/${franchise.id}/store/${newStore.id}`)
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send();
  const newCount = (
    await request(app)
      .get(`/api/franchise/${testUser.id}`)
      .set("Authorization", `Bearer ${testUserAuthToken}`)
      .send()
  ).body.find((f) => f.name == franchise.name).stores.length;

  expect(deleteRes.status).toBe(200);
  expect(deleteRes.body).toMatchObject({ message: "store deleted" });
  expect(newCount).toBe(count - 1);
});
