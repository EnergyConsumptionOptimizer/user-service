import { beforeAll, describe, expect, it } from "vitest";

import { app } from "../app";
import { User } from "@domain/User";
import request from "supertest";
import { mockAdminUser, mockHouseholdUserMark } from "../../storage/MockUsers";
import { UserID } from "@domain/UserID";

import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { userRepository, userService } from "../dependencies";

describe("api/users/", () => {
  const url = "/api/users";

  let admin: User;
  let adminAccessToken: string;

  let householdUserMark: User;
  let markAccessToken: string;

  const loginRequest = async (username: string, password: string) => {
    return request(app).post("/api/auth/login").send({
      username,
      password,
    });
  };

  const accessTokenFromLoginRequest = async (
    username: string,
    password: string,
  ) => {
    const res = await loginRequest(username, password);

    return "Bearer " + res.body.accessToken;
  };

  const setAuth = (token?: string) => token ?? "";

  beforeAll(async () => {
    admin = await userRepository.saveNewHouseholdUser({
      ...mockAdminUser,
      password: await bcrypt.hash(mockAdminUser.password, 10),
    });

    adminAccessToken = await accessTokenFromLoginRequest(
      admin.username,
      mockAdminUser.password,
    );

    householdUserMark = await userService.createHouseholdUser(
      mockHouseholdUserMark.username,
      mockHouseholdUserMark.password,
    );

    markAccessToken = await accessTokenFromLoginRequest(
      householdUserMark.username,
      mockHouseholdUserMark.password,
    );
  });

  describe("GET /:id - Retrieve an user", () => {
    const getUserRequest = async (id: UserID, token?: string) =>
      request(app)
        .get(url + "/" + id.value)
        .set("Authorization", setAuth(token));

    it("should allow to get a user", async () => {
      const response = await getUserRequest(
        householdUserMark.id,
        adminAccessToken,
      );

      expect(response.status).toBe(200);
      expect(response.body["id"]).toBe(householdUserMark.id.value);
      expect(response.body["username"]).toBe(householdUserMark.username);
    });

    it("should return 401 when no authentication is provided", async () => {
      const response = await getUserRequest(householdUserMark.id);

      expect(response.status).toBe(401);
    });

    it("should return 404 when user's ID does not exist", async () => {
      const response = await getUserRequest(
        { value: uuidv4() },
        adminAccessToken,
      );

      expect(response.status).toBe(404);
    });
  });

  describe("PATCH /:id/password - Update password", () => {
    const changePasswordRequest = async (
      id: UserID,
      password?: string,
      token?: string,
    ) =>
      request(app)
        .patch(url + "/" + id.value + "/password")
        .send({ password: password })
        .set("Authorization", setAuth(token));

    it("should allow admin to update any household user's password", async () => {
      const newPassword = "new-password";

      const response = await changePasswordRequest(
        householdUserMark.id,
        newPassword,
        adminAccessToken,
      );

      expect(response.status).toBe(200);
      expect(response.body["id"]).toBe(householdUserMark.id.value);

      const authResponse = await loginRequest(
        householdUserMark.username,
        newPassword,
      );
      expect(authResponse.status).toBe(200);
    });

    it("should update the password of a household user by the same household user who owns the account", async () => {
      const newPassword = "new-password";

      const response = await changePasswordRequest(
        householdUserMark.id,
        newPassword,
        markAccessToken,
      );

      expect(response.status).toBe(200);
      expect(response.body["id"]).toBe(householdUserMark.id.value);

      const authResponse = await loginRequest(
        householdUserMark.username,
        newPassword,
      );
      expect(authResponse.status).toBe(200);
    });

    it("should return 400 status code when no data is provided", async () => {
      const response = await changePasswordRequest(
        householdUserMark.id,
        undefined,
        adminAccessToken,
      );

      expect(response.status).toBe(400);
    });

    it("should return 401 when no auth is provided", async () => {
      const response = await changePasswordRequest(
        householdUserMark.id,
        "password",
      );

      expect(response.status).toBe(401);
    });

    it("should return 403 when household user tries to update another user's password", async () => {
      const user = await userService.createHouseholdUser("alex", "password");
      const response = await changePasswordRequest(
        user.id,
        "password",
        markAccessToken,
      );

      expect(response.status).toBe(403);
    });

    it("should return 404 when household user doesn't exists", async () => {
      const response = await changePasswordRequest(
        { value: uuidv4() },
        "password",
        adminAccessToken,
      );

      expect(response.status).toBe(404);
    });
  });
});
