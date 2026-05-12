import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	type ComponentTestContext,
	clearDatabase,
	composeAppForComponentTest,
	startMongo,
	stopMongo,
} from "./setup";

const ADMIN = {
	"X-User-Id": "admin-id",
	"X-User-Role": "ADMIN",
	"X-User-Username": "admin",
};

describe("Auth Component", () => {
	let ctx: ComponentTestContext;

	beforeAll(startMongo);
	afterAll(stopMongo);

	beforeEach(async () => {
		await clearDatabase();
		ctx = await composeAppForComponentTest();
	});

	describe("Feature: Login", () => {
		it("Given valid credentials, When login, Then returns 200 with auth cookies and user", async () => {
			await request(ctx.app)
				.post("/api/users")
				.set(ADMIN)
				.send({ username: "testuser", password: "password123" });

			const res = await request(ctx.app)
				.post("/api/auth/login")
				.send({ username: "testuser", password: "password123" });

			expect(res.status).toBe(StatusCodes.OK);
			expect(res.body).toEqual({
				id: expect.any(String) as string,
				username: "testuser",
				role: "HOUSEHOLD",
			});
			expect(res.headers["set-cookie"]).toBeDefined();
			expect(res.headers["set-cookie"][0]).toContain("authToken=");
			expect(res.headers["set-cookie"][1]).toContain("refreshToken=");
		});

		it("Given unknown username, When login, Then returns 401", async () => {
			const res = await request(ctx.app)
				.post("/api/auth/login")
				.send({ username: "unknown", password: "anything" });

			expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
			expect(res.body.code).toBe("UNAUTHORIZED");
		});

		it("Given wrong password, When login, Then returns 401", async () => {
			await request(ctx.app)
				.post("/api/users")
				.set(ADMIN)
				.send({ username: "testuser", password: "password123" });

			const res = await request(ctx.app)
				.post("/api/auth/login")
				.send({ username: "testuser", password: "wrong" });

			expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
			expect(res.body.code).toBe("UNAUTHORIZED");
		});

		it("Given admin credentials, When login, Then returns admin user", async () => {
			const res = await request(ctx.app)
				.post("/api/auth/login")
				.send({ username: "admin", password: "admin123" });

			expect(res.status).toBe(StatusCodes.OK);
			expect(res.body.role).toBe("ADMIN");
		});

		it("Given missing body fields, When login, Then returns 400", async () => {
			const res = await request(ctx.app).post("/api/auth/login").send({});

			expect(res.status).toBe(StatusCodes.BAD_REQUEST);
			expect(res.body.code).toBe("VALIDATION_ERROR");
		});
	});

	describe("Feature: Logout", () => {
		it("When logout, Then returns 200 and clears auth cookies", async () => {
			const res = await request(ctx.app).post("/api/auth/logout");

			expect(res.status).toBe(StatusCodes.OK);
			expect(res.body).toEqual({ message: "Logged out successfully" });
			expect(res.headers["set-cookie"]).toBeDefined();
			expect(res.headers["set-cookie"][0]).toContain("authToken=;");
			expect(res.headers["set-cookie"][1]).toContain("refreshToken=;");
		});
	});

	describe("Feature: Token refresh", () => {
		it("Given valid refresh token cookie, When refresh, Then returns 200 with new tokens", async () => {
			await request(ctx.app)
				.post("/api/users")
				.set(ADMIN)
				.send({ username: "testuser", password: "password123" });

			const loginRes = await request(ctx.app)
				.post("/api/auth/login")
				.send({ username: "testuser", password: "password123" });

			const cookies = loginRes.headers["set-cookie"] as unknown as string[];
			const refreshCookie = cookies.find((c) =>
				c.startsWith("refreshToken="),
			) as string;

			const res = await request(ctx.app)
				.post("/api/auth/refresh")
				.set("Cookie", refreshCookie);

			expect(res.status).toBe(StatusCodes.OK);
			expect(res.body).toEqual({
				id: expect.any(String) as string,
				username: "testuser",
				role: "HOUSEHOLD",
			});
			expect(res.headers["set-cookie"][0]).toContain("authToken=");
			expect(res.headers["set-cookie"][1]).toContain("refreshToken=");
		});

		it("Given missing refresh token cookie, When refresh, Then returns 401", async () => {
			const res = await request(ctx.app).post("/api/auth/refresh");

			expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
			expect(res.body.code).toBe("UNAUTHORIZED");
		});

		it("Given invalid refresh token, When refresh, Then returns 401", async () => {
			const res = await request(ctx.app)
				.post("/api/auth/refresh")
				.set("Cookie", "refreshToken=expired-token");

			expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
			expect(res.body.code).toBe("UNAUTHORIZED");
		});
	});
});
