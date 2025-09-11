import { beforeAll, describe, expect, it } from "vitest";

import { app } from "../app";
import { User } from "../../../domain/User";
import request from "supertest";
import {
  mockAdminUser,
  mockHouseholdUserDavid,
  mockHouseholdUserEmma,
  mockHouseholdUserMark,
} from "../../storage/MockUsers";
import { UserID } from "../../../domain/UserID";
import {
  userRepository,
  userService,
} from "../../../interfaces/api/dependencies";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

describe("api/household-users/", () => {
  const url = "/api/household-users";
  const buildIDUrl = (id: UserID) => `${url}/${id.value}`;

  let admin: User;
  let householdUserMark: User;
  let householdUserDavid: User;

  let adminAccessToken: string;
  let markAccessToken: string;

  beforeAll(async () => {
    const adminHashedPassword = await bcrypt.hash(mockAdminUser.password, 10);

    admin = await userRepository.addNewHouseholdUser({
      ...mockAdminUser,
      password: adminHashedPassword,
    });

    householdUserMark = await userService.createHouseholdUser(
      mockHouseholdUserMark.username,
      mockHouseholdUserMark.password,
    );

    householdUserDavid = await userService.createHouseholdUser(
      mockHouseholdUserDavid.username,
      mockHouseholdUserDavid.password,
    );

    const authResponse = await request(app).post("/api/auth/login").send({
      username: admin.username,
      password: mockAdminUser.password,
    });

    adminAccessToken = "Bearer " + authResponse.body.accessToken;

    const authResponseMark = await request(app).post("/api/auth/login").send({
      username: mockHouseholdUserMark.username,
      password: mockHouseholdUserMark.password,
    });

    markAccessToken = "Bearer " + authResponseMark.body.accessToken;
  });

  describe("GET /", () => {
    it("should return the list of household users when the admin requests it", async () => {
      const response = await request(app)
        .get(url)
        .set("Authorization", adminAccessToken);

      expect(response.status).toBe(200);

      const usernames = response.body["household-users"].map(
        (u: User) => u.username,
      );

      expect(usernames.sort()).toEqual(
        [
          mockHouseholdUserMark.username,
          mockHouseholdUserDavid.username,
        ].sort(),
      );
    });

    it("should return 401 when no auth is provided", async () => {
      const response = await request(app).get(url);

      expect(response.status).toBe(401);
    });

    it("should return 403 when a non-admin user tries to access", async () => {
      const response = await request(app)
        .get(url)
        .set("Authorization", markAccessToken);

      expect(response.status).toBe(403);
    });
  });

  describe("POST /", () => {
    it("should add a new household user when valid username and password are provided by the admin", async () => {
      const newUser = mockHouseholdUserEmma;
      const response = await request(app)
        .post(url)
        .send({
          username: newUser.username,
          password: newUser.password,
        })
        .set("Authorization", adminAccessToken);

      expect(response.status).toBe(201);

      expect(response.body["username"]).toBe(newUser.username);
    });

    it("should return 400 status code when no data is provided", async () => {
      const response = await request(app)
        .post(url)
        .send({})
        .set("Authorization", adminAccessToken);

      expect(response.status).toBe(400);
    });

    it("should return 401 when no auth is provided", async () => {
      const response = await request(app).post(url).send({
        username: "username",
        password: "password",
      });

      expect(response.status).toBe(401);
    });

    it("should return 403 when an household user tries to access", async () => {
      const response = await request(app)
        .post(url)
        .set("Authorization", markAccessToken)
        .send({
          username: "username",
          password: "password",
        });

      expect(response.status).toBe(403);
    });

    it("should return 409 status code when the admin tries to create an account with an already existing username", async () => {
      const response = await request(app)
        .post(url)
        .send({
          username: householdUserMark.username,
          password: "password",
        })
        .set("Authorization", adminAccessToken);

      expect(response.status).toBe(409);
    });
  });

  describe("PUT /:id/username", () => {
    const buildChangeUsernameUrl = (id: UserID) => buildIDUrl(id) + "/username";

    it("should update the username of an existing household user by the admin", async () => {
      const user = await userService.createHouseholdUser("alex", "password");

      const response = await request(app)
        .put(buildChangeUsernameUrl(user.id))
        .send({
          newUsername: "riley",
        })
        .set("Authorization", adminAccessToken);

      expect(response.status).toBe(204);
    });

    it("should update the username of a household user by the same household user who owns the account", async () => {
      const response = await request(app)
        .put(buildChangeUsernameUrl(householdUserMark.id))
        .send({
          newUsername: "mark01",
        })
        .set("Authorization", markAccessToken);

      expect(response.status).toBe(204);
    });

    it("should return 401 when no auth is provided", async () => {
      const response = await request(app)
        .put(buildChangeUsernameUrl(householdUserMark.id))
        .send({
          newUsername: "username",
        });

      expect(response.status).toBe(401);
    });

    it("should return 403 when a household user tries to update another household user's username", async () => {
      const response = await request(app)
        .put(buildChangeUsernameUrl(householdUserDavid.id))
        .set("Authorization", markAccessToken)
        .send({
          newUsername: "alex",
        });

      expect(response.status).toBe(403);
    });

    it("should return 404 when trying to update admin username", async () => {
      const response = await request(app)
        .put(buildChangeUsernameUrl(admin.id))
        .send({
          newUsername: "username",
        })
        .set("Authorization", adminAccessToken);

      expect(response.status).toBe(404);
    });

    it("should return 404 when household user doesn't exists", async () => {
      const response = await request(app)
        .put(buildChangeUsernameUrl({ value: uuidv4() }))
        .send({
          newUsername: "username",
        })
        .set("Authorization", adminAccessToken);

      expect(response.status).toBe(404);
    });

    it("should return 409 when trying to use an already existing username", async () => {
      const response = await request(app)
        .put(buildChangeUsernameUrl(householdUserDavid.id))
        .send({
          newUsername: householdUserMark.username,
        })
        .set("Authorization", adminAccessToken);

      expect(response.status).toBe(409);
    });
  });

  describe("DELETE /:id/", () => {
    it("should delete an existing household user by the admin", async () => {
      const user = await userService.createHouseholdUser("alex", "password");

      const response = await request(app)
        .delete(buildIDUrl(user.id))
        .set("Authorization", adminAccessToken);

      expect(response.status).toBe(204);
    });

    it("should return 401 when no auth is provided", async () => {
      const response = await request(app).delete(
        buildIDUrl(householdUserMark.id),
      );

      expect(response.status).toBe(401);
    });

    it("should return 403 an household user tries to access", async () => {
      const response = await request(app)
        .delete(buildIDUrl(householdUserMark.id))
        .set("Authorization", markAccessToken);

      expect(response.status).toBe(403);
    });

    it("should return 404 when trying to delete admin account", async () => {
      const response = await request(app)
        .delete(buildIDUrl(admin.id))
        .set("Authorization", adminAccessToken);

      expect(response.status).toBe(404);
    });

    it("should return 404 when household user doesn't exists", async () => {
      const response = await request(app)
        .delete(buildIDUrl({ value: uuidv4() }))
        .set("Authorization", adminAccessToken);

      expect(response.status).toBe(404);
    });
  });
});
