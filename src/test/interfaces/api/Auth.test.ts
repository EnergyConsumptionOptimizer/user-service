import { describe, it, beforeAll, expect } from "vitest";
import request from "supertest";
import { app } from "../app";
import { mockAdminUser } from "../../storage/MockUsers";
import {
  createAndLoginUser,
  parseAuthCookies,
  TestFixture,
} from "../utils/auth";

describe("Auth API Integration", () => {
  const baseUrl = "/api/auth";
  let adminFixture: TestFixture;

  beforeAll(async () => {
    adminFixture = await createAndLoginUser(mockAdminUser);
  });

  describe("POST /login", () => {
    it("allows a user to log in with correct credentials", async () => {
      const res = await request(app).post(`${baseUrl}/login`).send({
        username: adminFixture.user.username,
        password: adminFixture.passwordRaw,
      });

      expect(res.status).toBe(200);
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("rejects login attempts with incorrect credentials", async () => {
      await request(app)
        .post(`${baseUrl}/login`)
        .send({ username: adminFixture.user.username, password: "wrong" })
        .expect(401);
    });

    it("requires both username and password", async () => {
      await request(app)
        .post(`${baseUrl}/login`)
        .send({ username: "" })
        .expect(400);
    });
  });

  describe("POST /refresh", () => {
    it("issues new pair of tokens when providing ONLY a valid refresh token", async () => {
      // Wait > 1s to ensure JWT 'iat' timestamp changes (JWTs have 1s precision)
      await new Promise((resolve) => setTimeout(resolve, 1010));

      const onlyRefreshCookie = `refreshToken=${adminFixture.refreshToken}`;

      const res = await request(app)
        .post(`${baseUrl}/refresh`)
        .set("Cookie", onlyRefreshCookie);

      expect(res.status).toBe(200);

      const newCookies = await parseAuthCookies(res);

      expect(newCookies.accessToken).toBeTruthy();
      expect(newCookies.accessToken).not.toBe(adminFixture.accessToken);

      expect(newCookies.refreshToken).toBeTruthy();
      expect(newCookies.refreshToken).not.toBe(adminFixture.refreshToken);
    });

    it("requires a refresh token", async () => {
      await request(app).post(`${baseUrl}/refresh`).expect(401);
    });

    it("rejects invalid refresh tokens", async () => {
      await request(app)
        .post(`${baseUrl}/refresh`)
        .set("Cookie", "refreshToken=invalid")
        .expect(401);
    });
  });

  describe("POST /logout", () => {
    it("logs out successfully", async () => {
      await request(app)
        .post(`${baseUrl}/logout`)
        .set("Cookie", adminFixture.authHeader)
        .expect(200);
    });
  });
});
