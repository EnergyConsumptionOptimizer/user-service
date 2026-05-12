import type { Config } from "@bootstrap/config";
import type { Logger } from "pino";
import { pino } from "pino";

export type LoggerConfig = Pick<Config, "logLevel" | "appName">;

export function createLogger(config: LoggerConfig): Logger {
	return pino({
		level: config.logLevel,
		transport: {
			target: "pino-opentelemetry-transport",
			options: {
				loggerName: config.appName,
			},
		},
	});
}
