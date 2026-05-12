import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("user-service");

export const userCreationsTotal = meter.createCounter("user_creations_total", {
	description: "Total number of user creations",
});

export const userUpdatesTotal = meter.createCounter("user_updates_total", {
	description: "Total number of user updates",
});

export const userDeletionsTotal = meter.createCounter("user_deletions_total", {
	description: "Total number of user deletions",
});

export const userLoginsTotal = meter.createCounter("user_logins_total", {
	description: "Total number of successful user logins",
});
