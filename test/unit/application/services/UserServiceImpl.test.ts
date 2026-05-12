import { InvalidResetCodeError, UserNotFoundError } from "@application/errors";
import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import type { EventPublisher } from "@application/ports/out/EventPublisher";
import type { IdGenerator } from "@application/ports/out/IdGenerator";
import type { PasswordHasher } from "@application/ports/out/PasswordHasher";
import type { UnitOfWork } from "@application/ports/out/UnitOfWork";
import { UserServiceImpl } from "@application/services/UserServiceImpl";
import {
	InvalidPasswordError,
	InvalidUsernameError,
	ReservedUsernameError,
	UsernameAlreadyExistsError,
} from "@domain/errors";
import { UserCreatedEvent } from "@domain/events/UserCreatedEvent";
import { UserDeletedEvent } from "@domain/events/UserDeletedEvent";
import { UserRenamedEvent } from "@domain/events/UserRenamedEvent";
import type { UserRepository } from "@domain/ports/UserRepository";
import type { UniqueUsernameChecker } from "@domain/services/UniqueUsernameChecker";
import { UserRoles } from "@domain/value/UserRole";
import { aUser, validId, validUsername } from "@test/domainFactories";
import { beforeEach, describe, expect, it } from "vitest";
import { type MockProxy, mock } from "vitest-mock-extended";

const RESET_CODE = "valid-reset-code";

describe("UserServiceImpl", () => {
	let repository: MockProxy<UserRepository>;
	let idGenerator: MockProxy<IdGenerator>;
	let passwordHasher: MockProxy<PasswordHasher>;
	let usernamePolicy: MockProxy<UniqueUsernameChecker>;
	let uow: MockProxy<UnitOfWork>;
	let eventPublisher: MockProxy<EventPublisher>;
	let metrics: MockProxy<BusinessMetricsPort>;
	let service: UserServiceImpl;

	beforeEach(() => {
		repository = mock<UserRepository>();
		idGenerator = mock<IdGenerator>();
		passwordHasher = mock<PasswordHasher>();
		usernamePolicy = mock<UniqueUsernameChecker>();
		uow = mock<UnitOfWork>();
		eventPublisher = mock<EventPublisher>();
		metrics = mock<BusinessMetricsPort>();

		idGenerator.generate.mockReturnValue("gen-id");
		passwordHasher.hash.mockResolvedValue("hashed-pass");
		uow.executeTransactionally.mockImplementation(async (fn) =>
			(fn as () => Promise<unknown>)(),
		);

		service = new UserServiceImpl(
			repository,
			idGenerator,
			passwordHasher,
			usernamePolicy,
			RESET_CODE,
			uow,
			eventPublisher,
			metrics,
		);
	});

	describe("createHouseholdUser()", () => {
		it("should create a household user and publish event via outbox", async () => {
			usernamePolicy.ensureAvailable.mockResolvedValue(undefined);

			const result = await service.createHouseholdUser({
				username: "testuser",
				password: "plain-password",
			});

			expect(usernamePolicy.ensureAvailable).toHaveBeenCalled();
			expect(passwordHasher.hash).toHaveBeenCalledWith("plain-password");
			expect(result).toMatchObject({
				id: "gen-id",
				username: "testuser",
				role: "HOUSEHOLD",
			});
			expect(uow.executeTransactionally).toHaveBeenCalled();
			expect(repository.save).toHaveBeenCalled();
			expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
			expect(eventPublisher.publish).toHaveBeenCalledWith(
				expect.any(UserCreatedEvent),
			);
			expect(metrics.recordUserCreation).toHaveBeenCalled();
		});

		it("should return InvalidUsernameError when username is empty", async () => {
			const result = await service.createHouseholdUser({
				username: "",
				password: "plain-password",
			});

			expect(result).toBeInstanceOf(InvalidUsernameError);
			expect((result as InvalidUsernameError).code).toBe("USERNAME_EMPTY");
		});

		it("should return InvalidPasswordError when hashing produces empty value", async () => {
			passwordHasher.hash.mockResolvedValue("");

			const result = await service.createHouseholdUser({
				username: "testuser",
				password: "plain-password",
			});

			expect(result).toBeInstanceOf(InvalidPasswordError);
			expect((result as InvalidPasswordError).code).toBe("PASSWORD_EMPTY");
		});

		it("should return ReservedUsernameError when username is reserved", async () => {
			usernamePolicy.ensureAvailable.mockResolvedValue(
				new ReservedUsernameError("testuser"),
			);

			const result = await service.createHouseholdUser({
				username: "testuser",
				password: "plain-password",
			});

			expect(result).toBeInstanceOf(ReservedUsernameError);
			expect((result as ReservedUsernameError).code).toBe("RESERVED_USERNAME");
		});

		it("should return UsernameAlreadyExistsError when username already exists", async () => {
			usernamePolicy.ensureAvailable.mockResolvedValue(
				new UsernameAlreadyExistsError(),
			);

			const result = await service.createHouseholdUser({
				username: "testuser",
				password: "plain-password",
			});

			expect(result).toBeInstanceOf(UsernameAlreadyExistsError);
			expect((result as UsernameAlreadyExistsError).code).toBe(
				"USERNAME_ALREADY_EXISTS",
			);
		});
	});

	describe("getUser()", () => {
		it("should return user output when found", async () => {
			const user = aUser({
				id: validId("found-id"),
				username: validUsername("alice"),
			});
			repository.findById.mockResolvedValue(user);

			const result = await service.getUser({ id: "found-id" });

			expect(result).toMatchObject({
				id: "found-id",
				username: "alice",
				role: "HOUSEHOLD",
			});
		});

		it("should return UserNotFoundError when user does not exist", async () => {
			repository.findById.mockResolvedValue(undefined);

			const result = await service.getUser({ id: "unknown-id" });

			expect(result).toBeInstanceOf(UserNotFoundError);
			expect((result as UserNotFoundError).code).toBe("USER_NOT_FOUND");
		});
	});

	describe("getUserByUsername()", () => {
		it("should return user output when found", async () => {
			const user = aUser({ username: validUsername("alice") });
			repository.findByUsername.mockResolvedValue(user);

			const result = await service.getUserByUsername({ username: "alice" });

			expect(result).toMatchObject({
				id: "user-1",
				username: "alice",
				role: "HOUSEHOLD",
			});
		});

		it("should return UserNotFoundError when user does not exist", async () => {
			repository.findByUsername.mockResolvedValue(undefined);

			const result = await service.getUserByUsername({ username: "unknown" });

			expect(result).toBeInstanceOf(UserNotFoundError);
			expect((result as UserNotFoundError).code).toBe("USER_NOT_FOUND");
		});
	});

	describe("getHouseholdUsers()", () => {
		it("should return list of household users", async () => {
			const users = [
				aUser({ id: validId("id-1"), username: validUsername("alice") }),
				aUser({ id: validId("id-2"), username: validUsername("bob") }),
			];
			repository.findByRole.mockResolvedValue(users);

			const result = await service.getHouseholdUsers();

			expect(result).toHaveLength(2);
			expect(result[0]).toMatchObject({ id: "id-1", username: "alice" });
			expect(result[1]).toMatchObject({ id: "id-2", username: "bob" });
		});

		it("should return empty array when no household users exist", async () => {
			repository.findByRole.mockResolvedValue([]);

			const result = await service.getHouseholdUsers();

			expect(result).toEqual([]);
		});
	});

	describe("updateUsername()", () => {
		it("should update username and publish event via outbox", async () => {
			const user = aUser({ username: validUsername("oldname") });
			repository.findById.mockResolvedValue(user);
			usernamePolicy.ensureAvailable.mockResolvedValue(undefined);

			const result = await service.updateUsername({
				id: "user-1",
				newUsername: "newname",
			});

			expect(result).toMatchObject({ username: "newname" });
			expect(usernamePolicy.ensureAvailable).toHaveBeenCalled();
			expect(uow.executeTransactionally).toHaveBeenCalled();
			expect(repository.save).toHaveBeenCalled();
			expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
			expect(eventPublisher.publish).toHaveBeenCalledWith(
				expect.any(UserRenamedEvent),
			);
			expect(metrics.recordUserUpdate).toHaveBeenCalled();
		});

		it("should return UserNotFoundError when user does not exist", async () => {
			repository.findById.mockResolvedValue(undefined);

			const result = await service.updateUsername({
				id: "unknown-id",
				newUsername: "newname",
			});

			expect(result).toBeInstanceOf(UserNotFoundError);
			expect((result as UserNotFoundError).code).toBe("USER_NOT_FOUND");
		});

		it("should return InvalidUsernameError when new username is empty", async () => {
			const user = aUser();
			repository.findById.mockResolvedValue(user);

			const result = await service.updateUsername({
				id: "user-1",
				newUsername: "",
			});

			expect(result).toBeInstanceOf(InvalidUsernameError);
			expect((result as InvalidUsernameError).code).toBe("USERNAME_EMPTY");
		});

		it("should return error when username policy rejects", async () => {
			const user = aUser({ username: validUsername("oldname") });
			repository.findById.mockResolvedValue(user);
			usernamePolicy.ensureAvailable.mockResolvedValue(
				new UsernameAlreadyExistsError(),
			);

			const result = await service.updateUsername({
				id: "user-1",
				newUsername: "taken",
			});

			expect(result).toBeInstanceOf(UsernameAlreadyExistsError);
			expect((result as UsernameAlreadyExistsError).code).toBe(
				"USERNAME_ALREADY_EXISTS",
			);
		});
	});

	describe("deleteHouseholdUser()", () => {
		it("should delete user and publish event via outbox", async () => {
			const user = aUser();
			repository.findById.mockResolvedValue(user);

			const result = await service.deleteHouseholdUser({ id: "user-1" });

			expect(result).toBeUndefined();
			expect(uow.executeTransactionally).toHaveBeenCalled();
			expect(repository.remove).toHaveBeenCalled();
			expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
			expect(eventPublisher.publish).toHaveBeenCalledWith(
				expect.any(UserDeletedEvent),
			);
			expect(metrics.recordUserDeletion).toHaveBeenCalled();
		});

		it("should return UserNotFoundError when user does not exist", async () => {
			repository.findById.mockResolvedValue(undefined);

			const result = await service.deleteHouseholdUser({ id: "unknown-id" });

			expect(result).toBeInstanceOf(UserNotFoundError);
			expect((result as UserNotFoundError).code).toBe("USER_NOT_FOUND");
		});
	});

	describe("changePassword()", () => {
		it("should change password and save user", async () => {
			const user = aUser();
			repository.findById.mockResolvedValue(user);

			const result = await service.changePassword({
				id: "user-1",
				newPassword: "new-plain-password",
			});

			expect(result).toMatchObject({ id: "user-1" });
			expect(passwordHasher.hash).toHaveBeenCalledWith("new-plain-password");
			expect(repository.save).toHaveBeenCalled();
		});

		it("should return UserNotFoundError when user does not exist", async () => {
			repository.findById.mockResolvedValue(undefined);

			const result = await service.changePassword({
				id: "unknown-id",
				newPassword: "new-password",
			});

			expect(result).toBeInstanceOf(UserNotFoundError);
			expect((result as UserNotFoundError).code).toBe("USER_NOT_FOUND");
		});

		it("should return InvalidPasswordError when hashing produces empty value", async () => {
			const user = aUser();
			repository.findById.mockResolvedValue(user);
			passwordHasher.hash.mockResolvedValue("");

			const result = await service.changePassword({
				id: "user-1",
				newPassword: "new-password",
			});

			expect(result).toBeInstanceOf(InvalidPasswordError);
			expect((result as InvalidPasswordError).code).toBe("PASSWORD_EMPTY");
		});
	});

	describe("resetAdminPassword()", () => {
		it("should reset admin password with correct reset code", async () => {
			const admin = aUser({
				id: validId("admin-id"),
				username: validUsername("admin"),
				role: UserRoles.ADMIN,
			});
			repository.findByRole.mockResolvedValue([admin]);

			const result = await service.resetAdminPassword({
				resetCode: RESET_CODE,
				newPassword: "new-admin-password",
			});

			expect(result).toBeUndefined();
			expect(passwordHasher.hash).toHaveBeenCalledWith("new-admin-password");
			expect(repository.save).toHaveBeenCalled();
		});

		it("should return InvalidResetCodeError when code does not match", async () => {
			const result = await service.resetAdminPassword({
				resetCode: "wrong-code",
				newPassword: "new-password",
			});

			expect(result).toBeInstanceOf(InvalidResetCodeError);
			expect((result as InvalidResetCodeError).code).toBe("INVALID_RESET_CODE");
		});

		it("should return UserNotFoundError when admin user does not exist", async () => {
			repository.findByRole.mockResolvedValue([]);

			const result = await service.resetAdminPassword({
				resetCode: RESET_CODE,
				newPassword: "new-password",
			});

			expect(result).toBeInstanceOf(UserNotFoundError);
			expect((result as UserNotFoundError).code).toBe("USER_NOT_FOUND");
		});

		it("should return InvalidPasswordError when hashing produces empty value", async () => {
			const admin = aUser({
				id: validId("admin-id"),
				username: validUsername("admin"),
				role: UserRoles.ADMIN,
			});
			repository.findByRole.mockResolvedValue([admin]);
			passwordHasher.hash.mockResolvedValue("");

			const result = await service.resetAdminPassword({
				resetCode: RESET_CODE,
				newPassword: "new-password",
			});

			expect(result).toBeInstanceOf(InvalidPasswordError);
			expect((result as InvalidPasswordError).code).toBe("PASSWORD_EMPTY");
		});
	});
});
