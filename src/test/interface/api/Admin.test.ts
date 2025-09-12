import { beforeAll, describe, it, expect } from "vitest";
import bcrypt from "bcrypt";
import request from "supertest";
import { app } from "../app";
import { userRepository } from "../dependencies";
import { mockAdminUser, mockHouseholdUserMark } from "../../storage/MockUsers";
import { User } from "../../../domain/User";

describe("Admin API", () => {
  const url = "/api/admin";
  let admin: User;
  let adminAccessToken: string;

  const login = async (username: string, password: string) => {
    return request(app).post("/api/auth/login").send({ username, password });
  };

  const resetPassword = async (
    resetCode: string,
    newPassword: string,
    token?: string,
  ) => {
    return request(app)
      .post(`${url}/reset-password`)
      .set("Authorization", token ?? adminAccessToken)
      .send({ resetCode, newPassword });
  };

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(mockAdminUser.password, 10);
    admin = await userRepository.addNewHouseholdUser({
      ...mockAdminUser,
      password: hashedPassword,
    });

    const loginRes = await login(admin.username, mockAdminUser.password);
    adminAccessToken = `Bearer ${loginRes.body.accessToken}`;
  });

  describe("POST /reset-password", () => {
    it("allows an admin to reset their password using a valid reset code", async () => {
      const newPassword = "newPassword";
      const validResetCode = process.env.RESET_CODE || "";

      const res = await resetPassword(validResetCode, newPassword);
      expect(res.status).toBe(204);

      const oldLogin = await login(admin.username, mockAdminUser.password);
      expect(oldLogin.status).toBe(422);

      const newLogin = await login(admin.username, newPassword);
      expect(newLogin.status).toBe(200);
    });

    it("rejects the request if reset code or new password is missing", async () => {
      const res = await resetPassword("", "anotherPassword!");
      expect(res.status).toBe(400);
    });

    it("rejects the request if the reset code is invalid", async () => {
      const res = await resetPassword("INVALID_CODE", "irrelevantPassword!");
      expect(res.status).toBe(422);
    });

    it("prevents non-admin users from resetting admin passwords", async () => {
      const hashedPassword = await bcrypt.hash(
        mockHouseholdUserMark.password,
        10,
      );
      const mark = await userRepository.addNewHouseholdUser({
        ...mockHouseholdUserMark,
        password: hashedPassword,
      });

      const markLoginRes = await login(
        mark.username,
        mockHouseholdUserMark.password,
      );
      const markAccessToken = `Bearer ${markLoginRes.body.accessToken}`;

      const validResetCode = process.env.RESET_CODE || "VALID_CODE";
      const newPassword = "newPasswordForMarkTest";

      const res = await resetPassword(
        validResetCode,
        newPassword,
        markAccessToken,
      );
      expect(res.status).toBe(403);
    });
  });
});
