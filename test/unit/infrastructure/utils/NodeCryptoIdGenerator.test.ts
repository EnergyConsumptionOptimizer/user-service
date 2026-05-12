import { NodeCryptoIdGenerator } from "@infrastructure/utils/NodeCryptoIdGenerator";
import { describe, expect, it } from "vitest";

describe("NodeCryptoIdGenerator", () => {
	const generator = new NodeCryptoIdGenerator();

	it("should return a non-empty string identifier", () => {
		const result = generator.generate();

		expect(result).toBeTruthy();
		expect(typeof result).toBe("string");
	});

	it("should produce unique identifiers across successive calls", () => {
		const id1 = generator.generate();
		const id2 = generator.generate();

		expect(id1).not.toBe(id2);
	});
});
