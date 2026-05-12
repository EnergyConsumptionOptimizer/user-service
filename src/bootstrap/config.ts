import ms, { type StringValue } from "ms";
import { z } from "zod";

const DurationString = z
	.string()
	.refine((v) => ms(v as StringValue) !== undefined, {
		message:
			"Invalid duration format. Use a number followed by ms, s, m, h, or d (e.g., '1h', '7d').",
	});

export const EnvSchema = z.object({
	PORT: z.coerce.number().default(3000),
	MONGO_URI: z.string().optional(),
	MONGODB_HOST: z.string().default("localhost"),
	MONGODB_PORT: z.coerce.number().default(27017),
	MONGO_DB: z.string().default("user-service"),
	JWT_SECRET_KEY: z.string().default("change-me-in-production"),
	JWT_EXPIRES_IN: DurationString.default("1h"),
	JWT_REFRESH_EXPIRES_IN: DurationString.default("7d"),
	LOG_LEVEL: z
		.enum(["trace", "debug", "info", "warn", "error", "fatal"])
		.default("info"),
	RESET_CODE: z.string().default("123456"),
	NAME: z.string().default("user-service"),
	SEED_USERS: z
		.string()
		.optional()
		.transform((val) => {
			if (!val) return undefined;
			return val.split(",").map((entry) => {
				const [username, password, role] = entry.split(":");
				return { username, password, role } as const;
			});
		}),
	SKIP_SEED: z
		.string()
		.optional()
		.transform((val) => val === "true"),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
	console.error(
		"Invalid environment configuration:",
		JSON.stringify(result.error.issues, null, 2),
	);
	process.exit(1);
}

const env = result.data;

export const config = {
	port: env.PORT,
	mongo: {
		uri:
			env.MONGO_URI ??
			`mongodb://${env.MONGODB_HOST}:${env.MONGODB_PORT}/${env.MONGO_DB}`,
	},
	jwt: {
		secret: env.JWT_SECRET_KEY,
		expiresIn: env.JWT_EXPIRES_IN,
		refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
	},
	logLevel: env.LOG_LEVEL,
	resetCode: env.RESET_CODE,
	appName: env.NAME,
	seedUsers: env.SEED_USERS,
	skipSeed: env.SKIP_SEED,
} as const;

export type Config = typeof config;
