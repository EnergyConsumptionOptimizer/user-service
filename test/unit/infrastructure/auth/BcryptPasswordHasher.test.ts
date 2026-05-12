import { BcryptPasswordHasher } from "@infrastructure/auth/BcryptPasswordHasher";
import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bcryptjs", () => ({
	default: {
		hash: vi.fn(),
		compare: vi.fn(),
	},
}));

describe("BcryptPasswordHasher", () => {
	let hasher: BcryptPasswordHasher;

	beforeEach(() => {
		vi.clearAllMocks();
		hasher = new BcryptPasswordHasher();
	});

	describe("hash()", () => {
		it("should produce a hashed string from a plain-text password", async () => {
			vi.mocked(bcrypt.hash).mockResolvedValue("hashed-value" as never);

			const result = await hasher.hash("plain-password");

			expect(bcrypt.hash).toHaveBeenCalledWith("plain-password", 10);
			expect(result).toBe("hashed-value");
		});
	});

	describe("compare()", () => {
		it("should return true when the plain text matches the hash", async () => {
			vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

			const result = await hasher.compare("plain", "hashed");

			expect(bcrypt.compare).toHaveBeenCalledWith("plain", "hashed");
			expect(result).toBe(true);
		});

		it("should return false when the plain text does not match the hash", async () => {
			vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

			const result = await hasher.compare("plain", "wrong-hash");

			expect(result).toBe(false);
		});
	});
});
