import type { DomainEvent } from "@domain/events/DomainEvent";
import type { UserId } from "@domain/value/UserId";
import type { Username } from "@domain/value/Username";

export interface UserRenamedPayload extends Record<string, unknown> {
	readonly userId: string;
	readonly oldUsername: string;
	readonly newUsername: string;
}

export class UserRenamedEvent implements DomainEvent<UserRenamedPayload> {
	readonly eventType = "UserRenamedEvent";
	readonly aggregateType = "User";
	readonly aggregateId: string;
	readonly occurredAt: string;
	readonly payload: UserRenamedPayload;

	constructor(userId: UserId, oldUsername: Username, newUsername: Username) {
		this.aggregateId = userId.value;
		this.occurredAt = new Date().toISOString();
		this.payload = {
			userId: userId.value,
			oldUsername: oldUsername.value,
			newUsername: newUsername.value,
		};
	}
}
