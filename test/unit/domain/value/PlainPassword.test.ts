import { InvalidPasswordError } from "@domain/errors";
import { PlainPassword } from "@domain/value/PlainPassword";
import { describe, expect, it } from "vitest";

describe("PlainPassword Value Object", () => {
	describe("of() factory", () => {
		it.each([
			{ scenario: "a valid password", input: "securePass123" },
			{ scenario: "a minimum single character", input: "a" },
		])("should successfully create when provided $scenario", ({ input }) => {
			const result = PlainPassword.of(input);
			expect(result).toBeInstanceOf(PlainPassword);
			expect((result as PlainPassword).value).toBe(input);
		});

		it.each([
			{ scenario: "an empty string", input: "" },
		])("should return InvalidPasswordError when provided $scenario", ({
			input,
		}) => {
			const result = PlainPassword.of(input);
			expect(result).toBeInstanceOf(InvalidPasswordError);
			if (result instanceof InvalidPasswordError) {
				expect(result.code).toBe("PASSWORD_EMPTY");
			}
		});
	});
});
