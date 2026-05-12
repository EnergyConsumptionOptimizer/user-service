import type { DomainEvent } from "@domain/events/DomainEvent";
import type { UserId } from "@domain/value/UserId";
import type { Username } from "@domain/value/Username";

export interface UserDeletedPayload extends Record<string, unknown> {
	readonly userId: string;
	readonly username: string;
}

export class UserDeletedEvent implements DomainEvent<UserDeletedPayload> {
	readonly eventType = "UserDeletedEvent";
	readonly aggregateType = "User";
	readonly aggregateId: string;
	readonly occurredAt: string;
	readonly payload: UserDeletedPayload;

	constructor(userId: UserId, username: Username) {
		this.aggregateId = userId.value;
		this.occurredAt = new Date().toISOString();
		this.payload = { userId: userId.value, username: username.value };
	}
}
