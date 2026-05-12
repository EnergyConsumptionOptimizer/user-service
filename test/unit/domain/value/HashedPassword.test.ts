import { InvalidPasswordError } from "@domain/errors";
import { HashedPassword } from "@domain/value/HashedPassword";
import { describe, expect, it } from "vitest";

describe("HashedPassword Value Object", () => {
	describe("of() factory", () => {
		it.each([
			{ scenario: "a valid hashed string", input: "a1b2c3d4e5f6" },
			{ scenario: "a single character hash", input: "x" },
		])("should successfully create when provided $scenario", ({ input }) => {
			const result = HashedPassword.of(input);
			expect(result).toBeInstanceOf(HashedPassword);
			expect((result as HashedPassword).value).toBe(input);
		});

		it.each([
			{ scenario: "an empty string", input: "" },
		])("should return InvalidPasswordError when provided $scenario", ({
			input,
		}) => {
			const result = HashedPassword.of(input);
			expect(result).toBeInstanceOf(InvalidPasswordError);
			if (result instanceof InvalidPasswordError) {
				expect(result.code).toBe("PASSWORD_EMPTY");
			}
		});
	});

	describe("equals()", () => {
		it.each([
			{
				scenario: "the same underlying hash",
				val1: "abc123",
				val2: "abc123",
				expected: true,
			},
			{
				scenario: "different underlying hashes",
				val1: "abc123",
				val2: "def456",
				expected: false,
			},
		])("should return $expected when instances hold $scenario", ({
			val1,
			val2,
			expected,
		}) => {
			expect(
				(HashedPassword.of(val1) as HashedPassword).equals(
					HashedPassword.of(val2) as HashedPassword,
				),
			).toBe(expected);
		});
	});
});
