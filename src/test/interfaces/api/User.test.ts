import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { createAndLoginUser, TestFixture } from "../utils/auth";
import {
  mockAdminUser,
  mockHouseholdUserDavid,
  mockHouseholdUserMark,
} from "../../storage/MockUsers";

describe("api/users/", () => {
  const baseUrl = "/api/users";
  let admin: TestFixture;
  let mark: TestFixture;

  beforeAll(async () => {
    admin = await createAndLoginUser(mockAdminUser);
    mark = await createAndLoginUser(mockHouseholdUserMark);
  });

  describe("GET /:id", () => {
    it("should return user details", async () => {
      const res = await request(app)
        .get(`${baseUrl}/${mark.user.id.value}`)
        .set("Cookie", admin.authHeader);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(mark.user.id.value);
    });

    it("should return 404 for non-existent ID", async () => {
      await request(app)
        .get(`${baseUrl}/${mockHouseholdUserDavid.id.value}`)
        .set("Cookie", admin.authHeader)
        .expect(404);
    });
  });

  describe("PATCH /:id/password", () => {
    const updatePass = (
      id: string,
      password: string | undefined,
      auth: string,
    ) =>
      request(app)
        .patch(`${baseUrl}/${id}/password`)
        .set("Cookie", auth)
        .send({ password });

    it("should allow admin to update password", async () => {
      await updatePass(mark.user.id.value, "new-pass", admin.authHeader).expect(
        200,
      );

      await request(app)
        .post("/api/auth/login")
        .send({ username: mark.user.username, password: "new-pass" })
        .expect(200);
    });

    it("should allow user to update their own password", async () => {
      await updatePass(
        mark.user.id.value,
        "newer-pass",
        mark.authHeader,
      ).expect(200);
    });

    it("should return 403 when user updates another's password", async () => {
      const { user } = await createAndLoginUser({ username: "alex" });
      await updatePass(user.id.value, "not-my-pass", mark.authHeader).expect(
        403,
      );
    });
  });
});
