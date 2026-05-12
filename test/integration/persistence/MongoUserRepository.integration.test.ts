import { User } from "@domain/entity/User";
import { UsernameAlreadyExistsError } from "@domain/errors";
import { UserRoles } from "@domain/value/UserRole";
import { MongoUserRepository } from "@infrastructure/persistence/mongo/MongoUserRepository";
import { UserModel } from "@infrastructure/persistence/mongo/UserSchema";
import {
	aNewUser,
	aUser,
	HOUSEHOLD_ROLE,
	seedUser,
	validId,
	validUsername,
} from "@test/integration/persistence/fixtures";
import { clearDatabase, startMongo, stopMongo } from "@test/mongoSetup";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("MongoUserRepository (integration)", () => {
	let repository: MongoUserRepository;

	beforeAll(async () => {
		await startMongo();
		repository = new MongoUserRepository();
		await UserModel.createCollection();
	});

	afterAll(async () => {
		await stopMongo();
	});

	beforeEach(async () => {
		await clearDatabase();
	});

	describe("findById()", () => {
		it("returns a domain User when the document exists", async () => {
			await seedUser("alice-id", "alice");

			const result = await repository.findById(validId("alice-id"));

			expect(result).toBeInstanceOf(User);
			if (!result) return;
			expect(result.id.value).toBe("alice-id");
			expect(result.username.value).toBe("alice");
			expect(result.role).toBe(HOUSEHOLD_ROLE);
		});

		it("returns undefined when the document does not exist", async () => {
			const result = await repository.findById(validId("unknown-id"));

			expect(result).toBeUndefined();
		});
	});

	describe("findByUsername()", () => {
		it("returns a domain User when the username exists", async () => {
			await seedUser("bob-id", "bob");

			const result = await repository.findByUsername(validUsername("bob"));

			expect(result).toBeInstanceOf(User);
			if (!result) return;
			expect(result.username.value).toBe("bob");
		});

		it("returns undefined when the username does not exist", async () => {
			const result = await repository.findByUsername(validUsername("unknown"));

			expect(result).toBeUndefined();
		});
	});

	describe("findByRole()", () => {
		it("returns users filtered by role sorted by username", async () => {
			await seedUser("id-1", "alice");
			await seedUser("id-2", "bob");
			await seedUser("id-3", "admin-user", UserRoles.ADMIN);

			const result = await repository.findByRole(HOUSEHOLD_ROLE);

			expect(result).toHaveLength(2);
			expect(result[0]).toBeInstanceOf(User);
			expect(result[0].id.value).toBe("id-1");
			expect(result[0].username.value).toBe("alice");
			expect(result[1].id.value).toBe("id-2");
			expect(result[1].username.value).toBe("bob");
		});

		it("returns an empty array when no users match the role", async () => {
			await seedUser("id-1", "alice");

			const result = await repository.findByRole(UserRoles.ADMIN);

			expect(result).toEqual([]);
		});
	});

	describe("save()", () => {
		it("creates a new user document", async () => {
			const user = aNewUser({
				id: validId("new-id"),
				username: validUsername("newuser"),
			});

			await repository.save(user);

			const doc = await UserModel.findById("new-id").lean().exec();
			expect(doc).not.toBeNull();
			if (!doc) return;
			expect(doc.username).toBe("newuser");
			expect(doc.role).toBe(HOUSEHOLD_ROLE);
		});

		it("updates an existing user document", async () => {
			await seedUser("user-1", "oldname");
			const user = aUser({
				id: validId("user-1"),
				username: validUsername("newname"),
			});

			await repository.save(user);

			const doc = await UserModel.findById("user-1").lean().exec();
			if (!doc) return;
			expect(doc.username).toBe("newname");
		});

		it("throws UsernameAlreadyExistsError on duplicate username", async () => {
			await seedUser("user-1", "alice");
			const user = aNewUser({
				id: validId("user-2"),
				username: validUsername("alice"),
			});

			await expect(repository.save(user)).rejects.toThrow(
				UsernameAlreadyExistsError,
			);
		});
	});

	describe("remove()", () => {
		it("deletes the user document", async () => {
			await seedUser("user-1", "testuser");

			await repository.remove(aUser());

			const doc = await UserModel.findById("user-1").lean().exec();
			expect(doc).toBeNull();
		});
	});
});
