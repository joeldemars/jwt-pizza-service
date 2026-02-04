const request = require("supertest");
const app = require("../service");
const { Role, DB } = require("../database/database");
const { createTestUserObject } = require("../testUtils/authUtils");
const {
  createFranchise,
  createTestFranchiseObject,
  createTestStore,
} = require("../testUtils/franchiseUtils");

let testUser;
let testUserAuthToken;
let testFranchise;
let testStore;

beforeAll(async () => {
  testUser = {
    ...createTestUserObject(),
    roles: [{ role: Role.Admin }],
  };
  testUser.id = (await DB.addUser(testUser)).id;
  testUserAuthToken = (await request(app).put("/api/auth").send(testUser)).body
    .token;
  await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(createNewMenuItemObject());
  testFranchise = (
    await createFranchise(
      createTestFranchiseObject(testUser),
      testUserAuthToken,
    )
  ).body;
  testStore = await createTestStore(testFranchise, testUserAuthToken);
});

test("get menu", async () => {
  const menuRes = await request(app).get("/api/order/menu").send();

  expect(menuRes.status).toBe(200);
  expect(menuRes.body.length).toBeGreaterThan(0);
  expect(menuRes.body[0]).toHaveProperty(
    "id",
    "title",
    "image",
    "price",
    "description",
  );
});

test("add item to menu", async () => {
  const oldMenu = await getMenu();
  const menuItem = createNewMenuItemObject();
  const menuRes = await request(app)
    .put("/api/order/menu")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(menuItem);
  delete menuItem.price; // Floating point messes up comparison

  expect(menuRes.status).toBe(200);
  expect(menuRes.body.length).toBeGreaterThan(oldMenu.length);
  expect(menuRes.body).toEqual(
    expect.arrayContaining([expect.objectContaining(menuItem)]),
  );
});

test("create order", async () => {
  const item = (await getMenu())[0];
  const order = {
    franchiseId: testFranchise.id,
    storeId: testStore.id,
    items: [{ ...item, menuId: item.id }],
  };
  const prevOrders = await getOrders(testUserAuthToken);
  const orderRes = await request(app)
    .post("/api/order")
    .set("Content-Type", "application/json")
    .set("Authorization", `Bearer ${testUserAuthToken}`)
    .send(order);
  const newOrders = await getOrders(testUserAuthToken);

  expect(orderRes.status).toBe(200);
  expect(orderRes.body.order).toMatchObject(order);
  expect(orderRes.body).toHaveProperty("jwt");
  expect(prevOrders.orders.length).toBeLessThan(newOrders.orders.length);
});

function createNewMenuItemObject() {
  return {
    title: Math.random().toString(36).substring(2, 12),
    description: Math.random().toString(36).substring(2, 12),
    image: Math.random().toString(36).substring(2, 12),
    price: Math.random(),
  };
}

async function getMenu() {
  return (await request(app).get("/api/order/menu").send()).body;
}

async function getOrders(authToken) {
  return (
    await request(app)
      .get("/api/order")
      .set("Authorization", `Bearer ${testUserAuthToken}`)
      .send()
  ).body;
}
