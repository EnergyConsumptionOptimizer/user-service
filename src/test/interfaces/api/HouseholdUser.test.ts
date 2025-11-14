import { beforeAll, describe, expect, it } from "vitest";

import { app } from "../app";
import { User } from "@domain/User";
import request from "supertest";
import {
  mockAdminUser,
  mockHouseholdUserDavid,
  mockHouseholdUserEmma,
  mockHouseholdUserMark,
} from "../../storage/MockUsers";
import { UserID } from "@domain/UserID";

import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { userRepository, userService } from "../dependencies";

describe("api/household-users/", () => {
  const url = "/api/household-users";

  let admin: User;
  let adminAccessToken: string;

  let householdUserMark: User;
  let markAccessToken: string;

  let householdUserDavid: User;

  const accessTokenFromLoginRequest = async (
    username: string,
    password: string,
  ) => {
    const res = await request(app).post("/api/auth/login").send({
      username,
      password,
    });

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

    householdUserDavid = await userService.createHouseholdUser(
      mockHouseholdUserDavid.username,
      mockHouseholdUserDavid.password,
    );
  });

  describe("GET / - List household users", () => {
    const getAllRequest = async (token?: string) =>
      request(app).get(url).set("Authorization", setAuth(token));

    it("should return household users list when admin requests it", async () => {
      const response = await getAllRequest(adminAccessToken);

      expect(response.status).toBe(200);

      const usernames = response.body["household-users"]
        .map((u: User) => u.username)
        .sort();

      expect(usernames).toEqual(
        [
          mockHouseholdUserMark.username,
          mockHouseholdUserDavid.username,
        ].sort(),
      );
    });

    it("should return 401 when no authentication is provided", async () => {
      const response = await getAllRequest();

      expect(response.status).toBe(401);
    });

    it("should return 403 when non-admin user tries to access", async () => {
      const response = await getAllRequest(markAccessToken);

      expect(response.status).toBe(403);
    });
  });

  describe("POST / - Create household user", () => {
    const createNewHouseholdUserRequest = async (
      user?: { username: string; password: string },
      token?: string,
    ) => request(app).post(url).send(user).set("Authorization", setAuth(token));

    it("should create household user when admin provides valid username and password", async () => {
      const newUser = mockHouseholdUserEmma;

      const response = await createNewHouseholdUserRequest(
        mockHouseholdUserEmma,
        adminAccessToken,
      );

      expect(response.status).toBe(201);

      expect(response.body["username"]).toBe(newUser.username);
    });

    it("should return 400 status code when no data is provided", async () => {
      const response = await createNewHouseholdUserRequest(
        undefined,
        adminAccessToken,
      );

      expect(response.status).toBe(400);
    });

    it("should return 401 when no authentication is provided", async () => {
      const response = await createNewHouseholdUserRequest(
        mockHouseholdUserEmma,
      );

      expect(response.status).toBe(401);
    });

    it("should return 403 when household user tries to create account", async () => {
      const response = await createNewHouseholdUserRequest(
        mockHouseholdUserEmma,
        markAccessToken,
      );

      expect(response.status).toBe(403);
    });

    it("should return 409 when username already exists", async () => {
      const response = await createNewHouseholdUserRequest(
        mockHouseholdUserMark,
        adminAccessToken,
      );

      expect(response.status).toBe(409);
    });
  });

  describe("PATCH /:id/username - Update username", () => {
    const changeUsernameRequest = async (
      id: UserID,
      username?: string,
      token?: string,
    ) =>
      request(app)
        .patch(url + "/" + id.value + "/username")
        .send({ username: username })
        .set("Authorization", setAuth(token));

    it("should allow admin to update any household user's username", async () => {
      const user = await userService.createHouseholdUser("alex", "password");
      const newUsername = "riley";

      const response = await changeUsernameRequest(
        user.id,
        newUsername,
        adminAccessToken,
      );

      expect(response.status).toBe(200);
      expect(response.body["username"]).toBe(newUsername);
    });

    it("should update the username of a household user by the same household user who owns the account", async () => {
      householdUserMark.username = "mark01";
      const response = await changeUsernameRequest(
        householdUserMark.id,
        householdUserMark.username,
        markAccessToken,
      );

      expect(response.status).toBe(200);
      expect(response.body["username"]).toBe(householdUserMark.username);
    });

    it("should return 400 status code when no data is provided", async () => {
      const response = await changeUsernameRequest(
        householdUserMark.id,
        undefined,
        adminAccessToken,
      );

      expect(response.status).toBe(400);
    });

    it("should return 401 when no auth is provided", async () => {
      const response = await changeUsernameRequest(
        householdUserMark.id,
        "username",
      );

      expect(response.status).toBe(401);
    });

    it("should return 403 when household user tries to update another user's username", async () => {
      const response = await changeUsernameRequest(
        householdUserDavid.id,
        "username",
        markAccessToken,
      );

      expect(response.status).toBe(403);
    });

    it("should return 404 when trying to update admin username", async () => {
      const response = await changeUsernameRequest(
        admin.id,
        "username",
        adminAccessToken,
      );

      expect(response.status).toBe(404);
    });

    it("should return 404 when household user doesn't exists", async () => {
      const response = await changeUsernameRequest(
        { value: uuidv4() },
        "username",
        adminAccessToken,
      );

      expect(response.status).toBe(404);
    });

    it("should return 409 when trying to use existing username", async () => {
      const user = await userService.createHouseholdUser("alex", "password");

      const response = await changeUsernameRequest(
        user.id,
        householdUserMark.username,
        adminAccessToken,
      );

      expect(response.status).toBe(409);
    });
  });

  describe("DELETE /:id/ - Delete an household user", () => {
    const deleteHouseholdUserRequest = async (id: UserID, token?: string) =>
      request(app)
        .delete(url + "/" + id.value)
        .set("Authorization", setAuth(token));

    it("should allow admin to delete household user", async () => {
      const response = await deleteHouseholdUserRequest(
        householdUserDavid.id,
        adminAccessToken,
      );

      expect(response.status).toBe(204);
    });

    it("should return 401 when no authentication is provided", async () => {
      const response = await deleteHouseholdUserRequest(householdUserMark.id);

      expect(response.status).toBe(401);
    });

    it("should return 403 when household user tries to delete account", async () => {
      const response = await deleteHouseholdUserRequest(
        householdUserMark.id,
        markAccessToken,
      );

      expect(response.status).toBe(403);
    });

    it("should return 404 when trying to delete admin account", async () => {
      const response = await deleteHouseholdUserRequest(
        admin.id,
        adminAccessToken,
      );

      expect(response.status).toBe(404);
    });

    it("should return 404 when user does not exist", async () => {
      const response = await deleteHouseholdUserRequest(
        { value: uuidv4() },
        adminAccessToken,
      );

      expect(response.status).toBe(404);
    });
  });
});
