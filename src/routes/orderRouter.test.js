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
