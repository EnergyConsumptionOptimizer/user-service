import { beforeAll, describe, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { RESET_CODE } from "../dependencies";
import { mockAdminUser } from "../../storage/MockUsers";
import { createUser } from "../utils/auth";

describe("Admin API", () => {
  beforeAll(async () => {
    await createUser(mockAdminUser.username, mockAdminUser.password);
  });

  const resetPassword = (resetCode: string, password: string) =>
    request(app)
      .post(`/api/admin/reset-password`)
      .send({ resetCode, password });

  const login = (username: string, password: string) =>
    request(app).post("/api/auth/login").send({ username, password });

  describe("POST /reset-password", () => {
    it("allows to reset admin password using a valid reset code", async () => {
      const newPassword = "newPassword";

      await resetPassword(RESET_CODE, newPassword).expect(204);

      await login(mockAdminUser.username, mockAdminUser.password).expect(401);
      await login(mockAdminUser.username, newPassword).expect(200);
    });

    it("rejects the request if reset code or new password is missing", async () => {
      await resetPassword("", "pass").expect(400);
    });

    it("rejects the request if the reset code is invalid", async () => {
      await resetPassword("INVALID_CODE", "pass").expect(400);
    });
  });
});
