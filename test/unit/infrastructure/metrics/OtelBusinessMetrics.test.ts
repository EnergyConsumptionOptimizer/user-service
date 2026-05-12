import {
	userCreationsTotal,
	userDeletionsTotal,
	userLoginsTotal,
	userUpdatesTotal,
} from "@infrastructure/metrics/businessMetrics";
import { OtelBusinessMetrics } from "@infrastructure/metrics/OtelBusinessMetrics";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/metrics/businessMetrics", () => ({
	userCreationsTotal: { add: vi.fn() },
	userUpdatesTotal: { add: vi.fn() },
	userDeletionsTotal: { add: vi.fn() },
	userLoginsTotal: { add: vi.fn() },
}));

describe("OtelBusinessMetrics", () => {
	let metrics: OtelBusinessMetrics;

	beforeEach(() => {
		vi.clearAllMocks();
		metrics = new OtelBusinessMetrics();
	});

	it("should increment the user creations counter", () => {
		metrics.recordUserCreation();

		expect(userCreationsTotal.add).toHaveBeenCalledWith(1);
	});

	it("should increment the user updates counter", () => {
		metrics.recordUserUpdate();

		expect(userUpdatesTotal.add).toHaveBeenCalledWith(1);
	});

	it("should increment the user deletions counter", () => {
		metrics.recordUserDeletion();

		expect(userDeletionsTotal.add).toHaveBeenCalledWith(1);
	});

	it("should increment the user logins counter", () => {
		metrics.recordUserLogin();

		expect(userLoginsTotal.add).toHaveBeenCalledWith(1);
	});
});
