import { randomUUID } from "node:crypto";
import type { EventPublisher } from "@application/ports/out/EventPublisher";
import type { DomainEvent } from "@domain/events/DomainEvent";
import { EventEnvelope } from "@infrastructure/events/EventEnvelope";
import { OutboxEvent } from "@infrastructure/events/OutboxEvent";
import { mongoSessionContext } from "@infrastructure/persistence/mongo/mongoSessionContext";
import { trace } from "@opentelemetry/api";

export class MongoOutboxEventPublisher implements EventPublisher {
	async publish(event: DomainEvent): Promise<void> {
		const session = mongoSessionContext.getStore();
		if (!session) {
			throw new Error(
				"EventPublisher must always be called inside an UnitOfWork",
			);
		}

		const activeSpan = trace.getActiveSpan();

		const envelope = new EventEnvelope({
			event,
			eventId: randomUUID(),
			correlationId: activeSpan?.spanContext().traceId,
		});

		await OutboxEvent.create(
			[
				{
					eventId: envelope.eventId,
					aggregateId: envelope.event.aggregateId,
					aggregateType: envelope.event.aggregateType,
					eventType: envelope.event.eventType,
					occurredAt: envelope.event.occurredAt,
					payload: envelope.event.payload,
					correlationId: envelope.correlationId,
				},
			],
			{ session },
		);
	}
}
