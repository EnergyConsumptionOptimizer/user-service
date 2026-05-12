import "dotenv/config";

import type { Server } from "node:http";
import { composeApp } from "@bootstrap/composeApp";
import { config } from "@bootstrap/config";
import { startInstrumentation } from "@root/instrumentation";
import { createLogger } from "@root/logger";
import mongoose from "mongoose";

const rootLogger = createLogger(config);
const logger = rootLogger.child({ component: "Server" });
const sdk = startInstrumentation();

function connectMongo(): Promise<void> {
	return mongoose
		.connect(config.mongo.uri, {
			serverSelectionTimeoutMS: 5000,
			connectTimeoutMS: 10000,
		})
		.then(() => {
			logger.info("connected to MongoDB");
		})
		.catch((err) => {
			logger.fatal({ err }, "failed to connect to MongoDB");
			process.exit(1);
		});
}
mongoose.connection.on("error", (err) => {
	logger.error({ err }, "MongoDB runtime connection error");
});

function setupGracefulShutdown(server: Server): void {
	const shutdown = async () => {
		logger.info("graceful shutdown initiated");
		server.close();
		await mongoose.disconnect();
		try {
			await sdk.shutdown();
			logger.info("OpenTelemetry SDK shut down");
		} catch (err) {
			logger.error({ err }, "error shutting down OpenTelemetry SDK");
		}
		process.exit(0);
	};

	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
}

async function start(): Promise<void> {
	await connectMongo();
	const { app } = await composeApp(rootLogger);
	const server = app.listen(config.port, () => {
		logger.info({ port: config.port }, "listening");
	});
	setupGracefulShutdown(server);
}

void start();
