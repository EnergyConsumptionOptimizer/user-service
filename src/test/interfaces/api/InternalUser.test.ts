import { beforeAll, describe, expect, it } from "vitest";

import { app } from "../app";
import { User } from "@domain/User";
import request from "supertest";
import { mockHouseholdUserMark } from "../../storage/MockUsers";
import { userService } from "../dependencies";

describe("api/internal/users", () => {
  const url = "/api/internal/users";

  let householdUserMark: User;

  beforeAll(async () => {
    householdUserMark = await userService.createHouseholdUser(
      mockHouseholdUserMark.username,
      mockHouseholdUserMark.password,
    );
  });

  describe("GET /:username - Retrieve an user", () => {
    const getUserRequest = async (username: string) =>
      request(app).get(url + "/" + username);

    it("should allow to get a user", async () => {
      const response = await getUserRequest(householdUserMark.username);

      expect(response.status).toBe(200);
      expect(response.body["id"]).toBe(householdUserMark.id.value);
      expect(response.body["username"]).toBe(householdUserMark.username);
    });

    it("should return 404 when user's username does not exist", async () => {
      const response = await getUserRequest("Emily");

      expect(response.status).toBe(404);
    });
  });
});
