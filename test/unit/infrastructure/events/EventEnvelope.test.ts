import type { DomainEvent } from "@domain/events/DomainEvent";
import { EventEnvelope } from "@infrastructure/events/EventEnvelope";
import { describe, expect, it } from "vitest";

function mockEvent(overrides?: Partial<DomainEvent>): DomainEvent {
	return {
		eventType: "TestEvent",
		occurredAt: "2024-01-01T00:00:00.000Z",
		aggregateId: "agg-1",
		aggregateType: "Test",
		payload: { key: "value" },
		...overrides,
	};
}

describe("EventEnvelope", () => {
	it("should hold the provided event and metadata", () => {
		const event = mockEvent();

		const envelope = new EventEnvelope({
			event,
			eventId: "uuid-1",
			correlationId: "corr-1",
		});

		expect(envelope.event).toBe(event);
		expect(envelope.eventId).toBe("uuid-1");
		expect(envelope.correlationId).toBe("corr-1");
	});

	it("should allow a missing correlationId", () => {
		const event = mockEvent();

		const envelope = new EventEnvelope({ event, eventId: "uuid-2" });

		expect(envelope.correlationId).toBeUndefined();
	});
});
