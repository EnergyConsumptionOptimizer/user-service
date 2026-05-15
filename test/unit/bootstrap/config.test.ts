import { EnvSchema } from "@bootstrap/config";
import { describe, expect, it } from "vitest";

describe("EnvSchema", () => {
	it("applies all defaults when given an empty object", () => {
		const result = EnvSchema.safeParse({});
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.PORT).toBe(3000);
		expect(result.data.MONGODB_HOST).toBe("localhost");
		expect(result.data.MONGODB_PORT).toBe(27017);
		expect(result.data.MONGO_DB).toBe("user");
		expect(result.data.JWT_SECRET_KEY).toBe("change-me-in-production");
		expect(result.data.JWT_EXPIRES_IN).toBe("1h");
		expect(result.data.JWT_REFRESH_EXPIRES_IN).toBe("7d");
		expect(result.data.LOG_LEVEL).toBe("info");
		expect(result.data.RESET_CODE).toBe("123456");
		expect(result.data.NAME).toBe("user-service");
		expect(result.data.SEED_USERS).toBeUndefined();
		expect(result.data.SKIP_SEED).toBe(false);
	});

	it("coerces string numbers for PORT and MONGODB_PORT", () => {
		const result = EnvSchema.safeParse({ PORT: "8080", MONGODB_PORT: "27018" });
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.PORT).toBe(8080);
		expect(result.data.MONGODB_PORT).toBe(27018);
	});

	it("accepts valid duration strings", () => {
		const result = EnvSchema.safeParse({
			JWT_EXPIRES_IN: "30m",
			JWT_REFRESH_EXPIRES_IN: "2d",
		});
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.JWT_EXPIRES_IN).toBe("30m");
		expect(result.data.JWT_REFRESH_EXPIRES_IN).toBe("2d");
	});

	it("rejects invalid duration format", () => {
		const result = EnvSchema.safeParse({ JWT_EXPIRES_IN: "10x" });
		expect(result.success).toBe(false);
	});

	it("rejects invalid LOG_LEVEL", () => {
		const result = EnvSchema.safeParse({ LOG_LEVEL: "verbose" });
		expect(result.success).toBe(false);
	});

	it("parses SEED_USERS comma-separated list", () => {
		const result = EnvSchema.safeParse({
			SEED_USERS: "alice:pass1:HOUSEHOLD,bob:pass2:ADMIN",
		});
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.SEED_USERS).toEqual([
			{ username: "alice", password: "pass1", role: "HOUSEHOLD" },
			{ username: "bob", password: "pass2", role: "ADMIN" },
		]);
	});

	it("returns undefined for empty SEED_USERS", () => {
		const result = EnvSchema.safeParse({ SEED_USERS: "" });
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.SEED_USERS).toBeUndefined();
	});

	it("parses SKIP_SEED=true as boolean true", () => {
		const result = EnvSchema.safeParse({ SKIP_SEED: "true" });
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.SKIP_SEED).toBe(true);
	});

	it("treats SKIP_SEED=false or absent as false", () => {
		const empty = EnvSchema.safeParse({ SKIP_SEED: "" });
		expect(empty.success).toBe(true);
		if (!empty.success) return;
		expect(empty.data.SKIP_SEED).toBe(false);

		const absent = EnvSchema.safeParse({});
		expect(absent.success).toBe(true);
		if (!absent.success) return;
		expect(absent.data.SKIP_SEED).toBe(false);
	});
});
