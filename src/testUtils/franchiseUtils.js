const request = require("supertest");
const app = require("../service");

async function createFranchise(franchise, authToken) {
  return await request(app)
    .post("/api/franchise")
    .set("Authorization", `Bearer ${authToken}`)
    .send(franchise);
}

function createTestFranchiseObject(testUser) {
  return {
    name: Math.random().toString(36).substring(2, 12),
    admins: [{ email: testUser.email }],
  };
}

async function createTestStore(franchise, authToken) {
  return (
    await request(app)
      .post(`/api/franchise/${franchise.id}/store`)
      .set("Authorization", `Bearer ${authToken}`)
      .send(createNewStoreObject(franchise))
  ).body;
}

function createNewStoreObject(franchise) {
  return {
    franchiseId: franchise.id,
    name: Math.random().toString(36).substring(2, 12),
  };
}

module.exports = {
  createFranchise,
  createTestFranchiseObject,
  createNewStoreObject,
  createTestStore,
};
