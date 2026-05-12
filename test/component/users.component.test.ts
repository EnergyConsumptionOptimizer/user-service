import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	type ComponentTestContext,
	clearDatabase,
	composeAppForComponentTest,
	RESET_CODE,
	startMongo,
	stopMongo,
} from "./setup";

const ADMIN = {
	"X-User-Id": "admin-id",
	"X-User-Role": "ADMIN",
	"X-User-Username": "admin",
};

const OTHER_ID = "22222222-2222-4222-8222-222222222222";
const UNKNOWN_ID = "99999999-9999-4999-8999-999999999999";

describe("Users Component", () => {
	let ctx: ComponentTestContext;

	beforeAll(startMongo);
	afterAll(stopMongo);

	beforeEach(async () => {
		await clearDatabase();
		ctx = await composeAppForComponentTest();
	});

	describe("Feature: Admin manages household users", () => {
		describe("Scenario: Create household user", () => {
			it("Given available username, When admin creates, Then returns 201", async () => {
				const res = await request(ctx.app)
					.post("/api/users")
					.set(ADMIN)
					.send({ username: "newuser", password: "pass123" });

				expect(res.status).toBe(StatusCodes.CREATED);
				expect(res.body).toEqual({
					id: expect.any(String) as string,
					username: "newuser",
					role: "HOUSEHOLD",
				});
			});

			it("Given duplicate username, When admin creates, Then returns 409", async () => {
				await request(ctx.app)
					.post("/api/users")
					.set(ADMIN)
					.send({ username: "taken", password: "pass" });

				const res = await request(ctx.app)
					.post("/api/users")
					.set(ADMIN)
					.send({ username: "taken", password: "pass123" });

				expect(res.status).toBe(StatusCodes.CONFLICT);
				expect(res.body.code).toBe("CONFLICT");
			});

			it("Given non-admin user, When creates, Then returns 403", async () => {
				const res = await request(ctx.app)
					.post("/api/users")
					.set({
						"X-User-Id": "user-1",
						"X-User-Role": "HOUSEHOLD",
						"X-User-Username": "testuser",
					})
					.send({ username: "newuser", password: "pass123" });

				expect(res.status).toBe(StatusCodes.FORBIDDEN);
				expect(res.body.code).toBe("FORBIDDEN");
			});

			it("Given no auth headers, When creates, Then returns 401", async () => {
				const res = await request(ctx.app)
					.post("/api/users")
					.send({ username: "newuser", password: "pass123" });

				expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
			});
		});

		describe("Scenario: List household users", () => {
			it("Given admin, When list, Then returns 200 with users", async () => {
				await request(ctx.app)
					.post("/api/users")
					.set(ADMIN)
					.send({ username: "alice", password: "pass" });
				await request(ctx.app)
					.post("/api/users")
					.set(ADMIN)
					.send({ username: "bob", password: "pass" });

				const res = await request(ctx.app).get("/api/users").set(ADMIN);

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body).toHaveLength(2);
				expect(res.body[0].username).toBe("alice");
				expect(res.body[1].username).toBe("bob");
			});

			it("Given non-admin, When list, Then returns 403", async () => {
				const res = await request(ctx.app).get("/api/users").set({
					"X-User-Id": "user-1",
					"X-User-Role": "HOUSEHOLD",
					"X-User-Username": "testuser",
				});

				expect(res.status).toBe(StatusCodes.FORBIDDEN);
			});
		});

		describe("Scenario: Edit household user account", () => {
			it("Given admin, When update username, Then returns 200", async () => {
				const createRes = await request(ctx.app)
					.post("/api/users")
					.set(ADMIN)
					.send({ username: "oldname", password: "pass" });
				const userId = createRes.body.id;

				const res = await request(ctx.app)
					.patch(`/api/users/${userId}/username`)
					.set(ADMIN)
					.send({ username: "newname" });

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body.username).toBe("newname");
			});

			it("Given admin, When update password, Then returns 200", async () => {
				const createRes = await request(ctx.app)
					.post("/api/users")
					.set(ADMIN)
					.send({ username: "testuser", password: "oldpass" });
				const userId = createRes.body.id;

				const res = await request(ctx.app)
					.patch(`/api/users/${userId}/password`)
					.set(ADMIN)
					.send({ password: "newpass" });

				expect(res.status).toBe(StatusCodes.OK);
			});

			it("Given target username is taken, When admin updates, Then returns 409", async () => {
				await request(ctx.app)
					.post("/api/users")
					.set(ADMIN)
					.send({ username: "taken", password: "pass" });
				const createRes = await request(ctx.app)
					.post("/api/users")
					.set(ADMIN)
					.send({ username: "oldname", password: "pass" });
				const userId = createRes.body.id;

				const res = await request(ctx.app)
					.patch(`/api/users/${userId}/username`)
					.set(ADMIN)
					.send({ username: "taken" });

				expect(res.status).toBe(StatusCodes.CONFLICT);
			});

			it("Given unknown user id, When admin updates, Then returns 404", async () => {
				const res = await request(ctx.app)
					.patch(`/api/users/${UNKNOWN_ID}/username`)
					.set(ADMIN)
					.send({ username: "newname" });

				expect(res.status).toBe(StatusCodes.NOT_FOUND);
				expect(res.body.code).toBe("RESOURCE_NOT_FOUND");
			});
		});

		describe("Scenario: Delete household user", () => {
			it("Given admin, When delete, Then returns 204", async () => {
				const createRes = await request(ctx.app)
					.post("/api/users")
					.set(ADMIN)
					.send({ username: "testuser", password: "pass" });
				const userId = createRes.body.id;

				const res = await request(ctx.app)
					.delete(`/api/users/${userId}`)
					.set(ADMIN);

				expect(res.status).toBe(StatusCodes.NO_CONTENT);
			});

			it("Given unknown user id, When admin deletes, Then returns 404", async () => {
				const res = await request(ctx.app)
					.delete(`/api/users/${UNKNOWN_ID}`)
					.set(ADMIN);

				expect(res.status).toBe(StatusCodes.NOT_FOUND);
			});
		});
	});

	describe("Feature: Household user manages own account", () => {
		describe("Scenario: Edit own account", () => {
			it("Given own user, When update username, Then returns 200", async () => {
				const createRes = await request(ctx.app)
					.post("/api/users")
					.set(ADMIN)
					.send({ username: "testuser", password: "pass" });
				const userId = createRes.body.id;

				const ownHeaders = {
					"X-User-Id": userId,
					"X-User-Role": "HOUSEHOLD",
					"X-User-Username": "testuser",
				};

				const res = await request(ctx.app)
					.patch(`/api/users/${userId}/username`)
					.set(ownHeaders)
					.send({ username: "newname" });

				expect(res.status).toBe(StatusCodes.OK);
				expect(res.body.username).toBe("newname");
			});

			it("Given own user, When update password, Then returns 200", async () => {
				const createRes = await request(ctx.app)
					.post("/api/users")
					.set(ADMIN)
					.send({ username: "testuser", password: "oldpass" });
				const userId = createRes.body.id;

				const ownHeaders = {
					"X-User-Id": userId,
					"X-User-Role": "HOUSEHOLD",
					"X-User-Username": "testuser",
				};

				const res = await request(ctx.app)
					.patch(`/api/users/${userId}/password`)
					.set(ownHeaders)
					.send({ password: "newpass" });

				expect(res.status).toBe(StatusCodes.OK);
			});

			it("Given another user's id, When update, Then returns 403", async () => {
				const res = await request(ctx.app)
					.patch(`/api/users/${OTHER_ID}/username`)
					.set({
						"X-User-Id": "user-1",
						"X-User-Role": "HOUSEHOLD",
						"X-User-Username": "testuser",
					})
					.send({ username: "newname" });

				expect(res.status).toBe(StatusCodes.FORBIDDEN);
			});
		});
	});

	describe("Feature: Admin resets password", () => {
		it("Given valid reset code, When reset, Then returns 204", async () => {
			const res = await request(ctx.app)
				.post("/api/admin/reset-password")
				.send({ resetCode: RESET_CODE, password: "newadminpass" });

			expect(res.status).toBe(StatusCodes.NO_CONTENT);
		});

		it("Given invalid reset code, When reset, Then returns 400", async () => {
			const res = await request(ctx.app)
				.post("/api/admin/reset-password")
				.send({ resetCode: "wrong-code", password: "newpass" });

			expect(res.status).toBe(StatusCodes.BAD_REQUEST);
			expect(res.body.code).toBe("BAD_REQUEST");
		});
	});

	describe("Feature: Internal auth verify", () => {
		it("Given valid auth token cookie, When verify, Then returns 200 with user", async () => {
			await request(ctx.app)
				.post("/api/users")
				.set(ADMIN)
				.send({ username: "testuser", password: "password123" });

			const loginRes = await request(ctx.app)
				.post("/api/auth/login")
				.send({ username: "testuser", password: "password123" });

			const cookies = loginRes.headers["set-cookie"] as unknown as string[];
			const authCookie = cookies.find((c) =>
				c.startsWith("authToken="),
			) as string;

			const res = await request(ctx.app)
				.get("/api/internal/auth/verify")
				.set("Cookie", authCookie);

			expect(res.status).toBe(StatusCodes.OK);
			expect(res.body.username).toBe("testuser");
			expect(res.body.role).toBe("HOUSEHOLD");
			expect(res.headers["x-user-id"]).toBe(res.body.id);
			expect(res.headers["x-user-role"]).toBe("HOUSEHOLD");
			expect(res.headers["x-user-username"]).toBe("testuser");
		});

		it("Given missing auth token, When verify, Then returns 401", async () => {
			const res = await request(ctx.app).get("/api/internal/auth/verify");

			expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
		});

		it("Given invalid auth token, When verify, Then returns 401", async () => {
			const res = await request(ctx.app)
				.get("/api/internal/auth/verify")
				.set("Cookie", "authToken=invalid-token");

			expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
		});
	});

	describe("Feature: Internal user lookup by username", () => {
		it("Given existing username, When lookup, Then returns 200", async () => {
			await request(ctx.app)
				.post("/api/users")
				.set(ADMIN)
				.send({ username: "testuser", password: "pass" });

			const res = await request(ctx.app).get("/api/internal/users/testuser");

			expect(res.status).toBe(StatusCodes.OK);
			expect(res.body.username).toBe("testuser");
		});

		it("Given unknown username, When lookup, Then returns 404", async () => {
			const res = await request(ctx.app).get("/api/internal/users/unknown");

			expect(res.status).toBe(StatusCodes.NOT_FOUND);
			expect(res.body.code).toBe("RESOURCE_NOT_FOUND");
		});
	});

	describe("Feature: Health check", () => {
		it("When health check, Then returns 200 with status ok", async () => {
			const res = await request(ctx.app).get("/health");

			expect(res.status).toBe(StatusCodes.OK);
			expect(res.body.status).toBe("ok");
		});
	});
});
