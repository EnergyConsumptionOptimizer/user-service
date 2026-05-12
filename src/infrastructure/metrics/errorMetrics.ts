import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("user-service");

export const userErrorsTotal = meter.createCounter("user_errors_total", {
	description: "Total number of errors in user service",
});
