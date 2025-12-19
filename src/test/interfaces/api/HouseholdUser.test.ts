import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { createAndLoginUser, TestFixture } from "../utils/auth";
import {
  mockAdminUser,
  mockHouseholdUserMark,
  mockHouseholdUserEmma,
} from "../../storage/MockUsers";
import { User } from "@domain/User";

describe("api/household-users/", () => {
  const url = "/api/household-users";
  let admin: TestFixture;
  let mark: TestFixture;
  let david: TestFixture;

  beforeAll(async () => {
    admin = await createAndLoginUser(mockAdminUser);
    mark = await createAndLoginUser(mockHouseholdUserMark);
    david = await createAndLoginUser({
      username: "david",
      password: "password",
    });
  });

  describe("GET /", () => {
    it("should return household users list when admin requests it", async () => {
      const res = await request(app).get(url).set("Cookie", admin.authHeader);

      expect(res.status).toBe(200);
      const users = res.body["household-users"] as User[];
      const usernames = users.map((u) => u.username);
      expect(usernames).toContain(mark.user.username);
      expect(usernames).toContain(david.user.username);
    });

    it("should return 401 when no authentication is provided", async () => {
      await request(app).get(url).expect(401);
    });
  });

  describe("POST /", () => {
    it("should create household user when admin provides valid data", async () => {
      const res = await request(app)
        .post(url)
        .set("Cookie", admin.authHeader)
        .send(mockHouseholdUserEmma);

      expect(res.status).toBe(201);
      expect(res.body.username).toBe(mockHouseholdUserEmma.username);
    });

    it("should return 400 when no data is provided", async () => {
      await request(app).post(url).set("Cookie", admin.authHeader).expect(400);
    });

    it("should return 403 when non-admin tries to create account", async () => {
      await request(app)
        .post(url)
        .set("Cookie", mark.authHeader)
        .send(mockHouseholdUserEmma)
        .expect(403);
    });

    it("should return 409 when username already exists", async () => {
      await request(app)
        .post(url)
        .set("Cookie", admin.authHeader)
        .send(mockHouseholdUserMark)
        .expect(409);
    });
  });

  describe("PATCH /:id/username", () => {
    const update = (id: string, username: string | undefined, auth: string) =>
      request(app)
        .patch(`${url}/${id}/username`)
        .set("Cookie", auth)
        .send({ username });

    it("should allow admin to update any username", async () => {
      const { user } = await createAndLoginUser({ username: "alex" });
      const res = await update(user.id.value, "riley", admin.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.username).toBe("riley");
    });

    it("should allow user to update their own username", async () => {
      const res = await update(mark.user.id.value, "mark01", mark.authHeader);
      expect(res.status).toBe(200);
      expect(res.body.username).toBe("mark01");
    });

    it("should return 403 when user updates another's username", async () => {
      await update(david.user.id.value, "hacked", mark.authHeader).expect(403);
    });

    it("should return 404 for non-existent user", async () => {
      await update(
        mockHouseholdUserEmma.id.value,
        mockHouseholdUserEmma.username,
        admin.authHeader,
      ).expect(404);
    });
  });

  describe("DELETE /:id", () => {
    it("should allow admin to delete household user", async () => {
      const { user } = await createAndLoginUser({ username: "temp" });
      await request(app)
        .delete(`${url}/${user.id.value}`)
        .set("Cookie", admin.authHeader)
        .expect(204);
    });

    it("should return 403 when user tries to delete account", async () => {
      await request(app)
        .delete(`${url}/${mark.user.id.value}`)
        .set("Cookie", mark.authHeader)
        .expect(403);
    });
  });
});
