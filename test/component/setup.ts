import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import { composeApp } from "@bootstrap/composeApp";
import { pino } from "pino";
import { vi } from "vitest";

vi.mock("@bootstrap/config", () => ({
	config: {
		port: 3000,
		mongo: { uri: "mongodb://placeholder" },
		jwt: {
			secret: "test-secret",
			expiresIn: "1h",
			refreshExpiresIn: "7d",
		},
		logLevel: "silent" as const,
		resetCode: "test-reset-code",
		seedUsers: [{ username: "admin", password: "admin123", role: "ADMIN" }],
		skipSeed: false,
		appName: "test",
	},
}));

export { clearDatabase, startMongo, stopMongo } from "@test/mongoSetup";

export const RESET_CODE = "test-reset-code";

export interface ComponentTestContext {
	app: Awaited<ReturnType<typeof composeApp>>["app"];
}

export async function composeAppForComponentTest(): Promise<ComponentTestContext> {
	const mockBusinessMetrics: BusinessMetricsPort = {
		recordUserCreation: vi.fn(),
		recordUserUpdate: vi.fn(),
		recordUserDeletion: vi.fn(),
		recordUserLogin: vi.fn(),
	};

	const { app } = await composeApp(
		pino({ level: "silent" }),
		mockBusinessMetrics,
	);

	return { app };
}
