import { InvalidUsernameError } from "@domain/errors";
import { Username } from "@domain/value/Username";
import { describe, expect, it } from "vitest";

describe("Username Value Object", () => {
	describe("of() factory", () => {
		it.each([
			{ scenario: "a valid string", input: "alice", expected: "alice" },
			{
				scenario: "surrounding whitespace",
				input: "   alice   ",
				expected: "alice",
			},
		])("should successfully create when provided $scenario", ({
			input,
			expected,
		}) => {
			const result = Username.of(input);
			expect(result).toBeInstanceOf(Username);
			expect((result as Username).value).toBe(expected);
		});

		it.each([
			{ scenario: "an empty string", input: "" },
			{ scenario: "only whitespace", input: "    " },
		])("should return InvalidUsernameError when provided $scenario", ({
			input,
		}) => {
			const result = Username.of(input);
			expect(result).toBeInstanceOf(InvalidUsernameError);
			if (result instanceof InvalidUsernameError) {
				expect(result.code).toBe("USERNAME_EMPTY");
			}
		});
	});

	describe("equals()", () => {
		it.each([
			{
				scenario: "the same underlying value",
				val1: "alice",
				val2: "alice",
				expected: true,
			},
			{
				scenario: "different underlying values",
				val1: "alice",
				val2: "bob",
				expected: false,
			},
		])("should return $expected when instances hold $scenario", ({
			val1,
			val2,
			expected,
		}) => {
			expect(
				(Username.of(val1) as Username).equals(Username.of(val2) as Username),
			).toBe(expected);
		});
	});
});
