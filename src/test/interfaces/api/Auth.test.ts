import { describe, it, beforeAll, expect } from "vitest";
import bcrypt from "bcrypt";
import request from "supertest";
import { app } from "../app";
import { userRepository } from "../dependencies";
import { mockAdminUser, mockHouseholdUserMark } from "../../storage/MockUsers";

describe("Auth API Integration", () => {
  const url = "/api/auth";

  const adminUser = mockAdminUser;
  const householdUser = mockHouseholdUserMark;

  const tokens: Record<string, { access: string; refresh: string }> = {};

  const login = async (username: string, password: string) =>
    request(app).post(`${url}/login`).send({ username, password });

  beforeAll(async () => {
    const hash = async (pwd: string) => bcrypt.hash(pwd, 10);

    await userRepository.saveNewHouseholdUser({
      ...adminUser,
      password: await hash(adminUser.password),
    });

    await userRepository.saveNewHouseholdUser({
      ...householdUser,
      password: await hash(householdUser.password),
    });

    const adminLogin = await login(adminUser.username, adminUser.password);
    const householdLogin = await login(
      householdUser.username,
      householdUser.password,
    );

    tokens.admin = {
      access: `Bearer ${adminLogin.body.accessToken}`,
      refresh: adminLogin.body.refreshToken,
    };
    tokens.household = {
      access: `Bearer ${householdLogin.body.accessToken}`,
      refresh: householdLogin.body.refreshToken,
    };
  });

  describe("POST /login", () => {
    it("allows a user to log in with correct credentials", async () => {
      const res = await login(adminUser.username, adminUser.password);
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it("rejects login attempts with incorrect credentials", async () => {
      const res1 = await login(adminUser.username, "wrongpass");
      const res2 = await login("nonexistentuser", "password");
      expect(res1.status).toBe(401);
      expect(res2.status).toBe(401);
    });

    it("requires both username and password", async () => {
      const res1 = await login("", adminUser.password);
      const res2 = await login(adminUser.username, "");
      expect(res1.status).toBe(400);
      expect(res2.status).toBe(400);
    });
  });

  describe("POST /refresh", () => {
    const refresh = (token?: string) =>
      request(app).post(`${url}/refresh`).send({ refreshToken: token });

    it("issues new tokens when refresh token is valid", async () => {
      const res = await refresh(tokens.admin.refresh);
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it("requires a refresh token", async () => {
      const res = await refresh();
      expect(res.status).toBe(400);
    });

    it("rejects invalid refresh tokens", async () => {
      const res = await refresh("invalid.token");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /logout", () => {
    const logout = (token?: string) =>
      request(app)
        .post(`${url}/logout`)
        .set("Authorization", token ?? "");

    it("logs out successfully with a valid access token", async () => {
      const res = await logout(tokens.admin.access);
      expect(res.status).toBe(200);
    });

    it("rejects requests with missing or invalid access tokens", async () => {
      const res1 = await logout();
      const res2 = await logout("Bearer invalid.token");

      expect(res1.status).toBe(401);
      expect(res2.status).toBe(401);
    });
  });
});
