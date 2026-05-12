import "dotenv/config";

import type { Server } from "node:http";
import { composeApp } from "@bootstrap/composeApp";
import { config } from "@bootstrap/config";
import mongoose from "mongoose";
import { startInstrumentation } from "./instrumentation.js";
import { createLogger } from "./logger.js";

const logger = createLogger(config);
const sdk = startInstrumentation();

function connectMongo(): Promise<void> {
	return mongoose
		.connect(config.mongo.uri, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 10000,
		})
		.then(() => {
			logger.info({ uri: config.mongo.uri }, "[Server] connected to MongoDB");
		})
		.catch((err) => {
			logger.fatal(
				{ error: err instanceof Error ? err.message : String(err) },
				"[Server] failed to connect to MongoDB",
			);
			process.exit(1);
		});
}
mongoose.connection.on("error", (err) => {
	logger.error({ error: err }, "[Server] MongoDB runtime connection error");
});

function setupGracefulShutdown(server: Server): void {
	const shutdown = async () => {
		logger.info("[Server] graceful shutdown initiated");
		server.close();
		await mongoose.disconnect();
		try {
			await sdk.shutdown();
			logger.info("[Server] OpenTelemetry SDK shut down");
		} catch (err) {
			logger.error(
				{ error: err instanceof Error ? err.message : String(err) },
				"[Server] error shutting down OpenTelemetry SDK",
			);
		}
		process.exit(0);
	};

	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
}

async function start(): Promise<void> {
	await connectMongo();
	const { app } = await composeApp(logger);
	const server = app.listen(config.port, () => {
		logger.info(`[Server] running on port ${config.port}`);
	});
	setupGracefulShutdown(server);
}

void start();
