import { User } from "@domain/entity/User";
import { UserCreatedEvent } from "@domain/events/UserCreatedEvent";
import { UserDeletedEvent } from "@domain/events/UserDeletedEvent";
import {
	HOUSEHOLD_ROLE,
	validId,
	validPassword,
	validUsername,
} from "@test/domainFactories";
import { describe, expect, it } from "vitest";

describe("User Entity", () => {
	describe("create()", () => {
		it("should create a user and emit UserCreatedEvent", () => {
			const id = validId();
			const username = validUsername();
			const password = validPassword();

			const user = User.create(id, username, password, HOUSEHOLD_ROLE);

			expect(user).toBeInstanceOf(User);
			expect(user.id).toBe(id);
			expect(user.username).toBe(username);
			expect(user.hashedPassword).toBe(password);
			expect(user.role).toBe(HOUSEHOLD_ROLE);

			const events = user.pullDomainEvents();
			expect(events).toHaveLength(1);
			expect(events[0]).toBeInstanceOf(UserCreatedEvent);
			expect((events[0] as UserCreatedEvent).payload).toEqual({
				userId: id.value,
				username: username.value,
				role: HOUSEHOLD_ROLE,
			});
		});
	});

	describe("restore()", () => {
		it("should restore a user without emitting domain events", () => {
			const result = User.restore(
				validId(),
				validUsername(),
				validPassword(),
				HOUSEHOLD_ROLE,
			);

			expect(result).toBeInstanceOf(User);
			expect(result.pullDomainEvents()).toHaveLength(0);
		});
	});

	describe("changeUsername()", () => {
		it("should update username", () => {
			const user = User.create(
				validId(),
				validUsername("oldname"),
				validPassword(),
				HOUSEHOLD_ROLE,
			);
			user.pullDomainEvents();

			const newUsername = validUsername("newname");
			user.changeUsername(newUsername);

			expect(user.username).toBe(newUsername);
		});
	});

	describe("changePassword()", () => {
		it("should update the password", () => {
			const user = User.create(
				validId(),
				validUsername(),
				validPassword(),
				HOUSEHOLD_ROLE,
			);

			const newPassword = validPassword("new-hash");
			user.changePassword(newPassword);

			expect(user.hashedPassword).toBe(newPassword);
		});
	});

	describe("prepareForDeletion()", () => {
		it("should emit UserDeletedEvent", () => {
			const user = User.create(
				validId(),
				validUsername(),
				validPassword(),
				HOUSEHOLD_ROLE,
			);
			user.pullDomainEvents();

			user.prepareForDeletion();

			const events = user.pullDomainEvents();
			expect(events).toHaveLength(1);
			expect(events[0]).toBeInstanceOf(UserDeletedEvent);
		});
	});

	describe("equals()", () => {
		it("should return true for users with the same id", () => {
			const id = validId();
			const u1 = User.create(
				id,
				validUsername("u1"),
				validPassword(),
				HOUSEHOLD_ROLE,
			);
			const u2 = User.create(
				id,
				validUsername("u2"),
				validPassword(),
				HOUSEHOLD_ROLE,
			);

			expect(u1.equals(u2)).toBe(true);
		});

		it("should return false for users with different ids", () => {
			const u1 = User.create(
				validId("id-1"),
				validUsername("u1"),
				validPassword(),
				HOUSEHOLD_ROLE,
			);
			const u2 = User.create(
				validId("id-2"),
				validUsername("u2"),
				validPassword(),
				HOUSEHOLD_ROLE,
			);

			expect(u1.equals(u2)).toBe(false);
		});
	});
});
