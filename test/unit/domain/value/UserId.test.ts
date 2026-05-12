import { InvalidUserIdError } from "@domain/errors";
import { UserId } from "@domain/value/UserId";
import { describe, expect, it } from "vitest";

describe("UserId Value Object", () => {
	describe("of() factory", () => {
		it.each([
			{ scenario: "a valid string", input: "12345", expected: "12345" },
			{
				scenario: "surrounding whitespace",
				input: "   12345   ",
				expected: "12345",
			},
		])("should successfully create when provided $scenario", ({
			input,
			expected,
		}) => {
			const result = UserId.of(input);
			expect(result).toBeInstanceOf(UserId);
			expect((result as UserId).value).toBe(expected);
		});

		it.each([
			{ scenario: "an empty string", input: "" },
			{ scenario: "only whitespace", input: "    " },
		])("should return InvalidUserIdError when provided $scenario", ({
			input,
		}) => {
			const result = UserId.of(input);
			expect(result).toBeInstanceOf(InvalidUserIdError);
			if (result instanceof InvalidUserIdError) {
				expect(result.code).toBe("USER_ID_EMPTY");
			}
		});
	});

	describe("equals()", () => {
		it.each([
			{
				scenario: "the same underlying value",
				val1: "12345",
				val2: "12345",
				expected: true,
			},
			{
				scenario: "different underlying values",
				val1: "12345",
				val2: "67890",
				expected: false,
			},
		])("should return $expected when instances hold $scenario", ({
			val1,
			val2,
			expected,
		}) => {
			expect(
				(UserId.of(val1) as UserId).equals(UserId.of(val2) as UserId),
			).toBe(expected);
		});
	});
});
