import type { DomainEvent } from "@domain/events/DomainEvent";
import type { UserId } from "@domain/value/UserId";
import type { Username } from "@domain/value/Username";
import type { UserRole } from "@domain/value/UserRole";

export interface UserCreatedPayload extends Record<string, unknown> {
	readonly userId: string;
	readonly username: string;
	readonly role: string;
}

export class UserCreatedEvent implements DomainEvent<UserCreatedPayload> {
	readonly eventType = "UserCreatedEvent";
	readonly aggregateType = "User";
	readonly aggregateId: string;
	readonly occurredAt: string;
	readonly payload: UserCreatedPayload;

	constructor(userId: UserId, username: Username, role: UserRole) {
		this.aggregateId = userId.value;
		this.occurredAt = new Date().toISOString();
		this.payload = {
			userId: userId.value,
			username: username.value,
			role: role,
		};
	}
}
