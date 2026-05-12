import type { User } from "@domain/entity/User";
import { UsernameAlreadyExistsError } from "@domain/errors";
import { UserCreatedEvent } from "@domain/events/UserCreatedEvent";
import { MongoOutboxEventPublisher } from "@infrastructure/events/MongoOutboxEventPublisher";
import {
	OutboxEvent,
	type OutboxEventDoc,
} from "@infrastructure/events/OutboxEvent";
import { MongoUnitOfWork } from "@infrastructure/persistence/mongo/MongoUnitOfWork";
import { MongoUserRepository } from "@infrastructure/persistence/mongo/MongoUserRepository";
import { UserModel } from "@infrastructure/persistence/mongo/UserSchema";
import { clearDatabase, startMongo, stopMongo } from "@test/mongoSetup";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	aNewUser,
	HOUSEHOLD_ROLE,
	seedUser,
	validId,
	validUsername,
} from "./fixtures";

describe("Outbox Pattern (integration)", () => {
	let uow: MongoUnitOfWork;
	let repository: MongoUserRepository;
	let eventPublisher: MongoOutboxEventPublisher;

	beforeAll(async () => {
		await startMongo();
		uow = new MongoUnitOfWork();
		repository = new MongoUserRepository();
		eventPublisher = new MongoOutboxEventPublisher();
		await OutboxEvent.createCollection();
		await UserModel.createCollection();
	});

	afterAll(async () => {
		await stopMongo();
	});

	beforeEach(async () => {
		await clearDatabase();
	});

	const saveWithOutbox = async (user: User): Promise<void> => {
		await uow.executeTransactionally(async () => {
			await repository.save(user);
			for (const event of user.pullDomainEvents()) {
				await eventPublisher.publish(event);
			}
		});
	};

	const findAllOutboxEvents = async (): Promise<OutboxEventDoc[]> => {
		return OutboxEvent.find({}).sort({ createdAt: 1 }).lean().exec();
	};

	it("persists both user and outbox event atomically on creation", async () => {
		const user = aNewUser({
			id: validId("user-1"),
			username: validUsername("testuser"),
		});

		await saveWithOutbox(user);

		const savedUser = await UserModel.findById("user-1").lean().exec();
		expect(savedUser).not.toBeNull();
		if (!savedUser) return;
		expect(savedUser.username).toBe("testuser");

		const outboxDocs = await findAllOutboxEvents();
		expect(outboxDocs).toHaveLength(1);
		expect(outboxDocs[0]).toMatchObject({
			eventType: "UserCreatedEvent",
			aggregateId: "user-1",
			aggregateType: "User",
			payload: { userId: "user-1", username: "testuser", role: HOUSEHOLD_ROLE },
		});
	});

	it("rolls back both user and outbox event on duplicate username", async () => {
		await seedUser("existing-id", "taken-username");

		const conflictingUser = aNewUser({
			id: validId("other-id"),
			username: validUsername("taken-username"),
		});

		await expect(saveWithOutbox(conflictingUser)).rejects.toThrow(
			UsernameAlreadyExistsError,
		);

		const userDoc = await UserModel.findById("other-id").lean().exec();
		expect(userDoc).toBeNull();

		const outboxDocs = await OutboxEvent.find({ aggregateId: "other-id" })
			.lean()
			.exec();
		expect(outboxDocs).toHaveLength(0);
	});

	it("publishes a UserRenamedEvent via the outbox", async () => {
		const user = aNewUser({
			id: validId("user-1"),
			username: validUsername("oldname"),
		});
		await saveWithOutbox(user);

		const saved = await repository.findById(validId("user-1"));
		if (!saved) return;
		saved.changeUsername(validUsername("newname"));
		await saveWithOutbox(saved);

		const outboxDocs = await findAllOutboxEvents();
		expect(outboxDocs).toHaveLength(2);
		expect(outboxDocs[0].eventType).toBe("UserCreatedEvent");
		expect(outboxDocs[1]).toMatchObject({
			eventType: "UserRenamedEvent",
			payload: { oldUsername: "oldname", newUsername: "newname" },
		});
	});

	it("publishes a UserDeletedEvent via the outbox", async () => {
		const user = aNewUser({
			id: validId("user-1"),
			username: validUsername("testuser"),
		});
		await saveWithOutbox(user);

		const existing = await repository.findById(validId("user-1"));
		if (!existing) return;
		existing.prepareForDeletion();
		await uow.executeTransactionally(async () => {
			await repository.remove(existing);
			for (const event of existing.pullDomainEvents()) {
				await eventPublisher.publish(event);
			}
		});

		const outboxDocs = await findAllOutboxEvents();
		expect(outboxDocs).toHaveLength(2);
		expect(outboxDocs[0].eventType).toBe("UserCreatedEvent");
		expect(outboxDocs[1]).toMatchObject({
			eventType: "UserDeletedEvent",
			aggregateId: "user-1",
		});
	});

	it("throws if event publisher is called outside a UnitOfWork", async () => {
		const event = new UserCreatedEvent(
			validId("user-1"),
			validUsername("testuser"),
			HOUSEHOLD_ROLE,
		);

		await expect(eventPublisher.publish(event)).rejects.toThrow(
			"EventPublisher must always be called inside an UnitOfWork",
		);
	});

	it("publishes multiple events from a single aggregate in one transaction", async () => {
		const user = aNewUser({
			id: validId("multi-event"),
			username: validUsername("eventsuser"),
		});
		await saveWithOutbox(user);

		const saved = await repository.findById(validId("multi-event"));
		if (!saved) return;
		saved.changeUsername(validUsername("renamed-eventsuser"));
		saved.prepareForDeletion();
		await uow.executeTransactionally(async () => {
			await repository.remove(saved);
			for (const event of saved.pullDomainEvents()) {
				await eventPublisher.publish(event);
			}
		});

		const outboxDocs = await findAllOutboxEvents();
		expect(outboxDocs).toHaveLength(3);
		expect(outboxDocs.map((d) => d.eventType)).toEqual([
			"UserCreatedEvent",
			"UserRenamedEvent",
			"UserDeletedEvent",
		]);
	});
});
