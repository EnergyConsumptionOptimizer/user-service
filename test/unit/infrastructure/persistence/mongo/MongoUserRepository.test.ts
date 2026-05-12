import { User } from "@domain/entity/User";
import { UsernameAlreadyExistsError } from "@domain/errors";
import { UserRoles } from "@domain/value/UserRole";
import { MongoUserRepository } from "@infrastructure/persistence/mongo/MongoUserRepository";
import { mongoSessionContext } from "@infrastructure/persistence/mongo/mongoSessionContext";
import {
	type UserDoc,
	UserModel,
} from "@infrastructure/persistence/mongo/UserSchema";
import {
	aUser,
	HOUSEHOLD_ROLE,
	validId,
	validUsername,
} from "@test/domainFactories";
import type { ClientSession } from "mongoose";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/persistence/mongo/UserSchema", () => ({
	UserModel: {
		findById: vi.fn(),
		findOne: vi.fn(),
		find: vi.fn(),
		replaceOne: vi.fn(),
		findByIdAndDelete: vi.fn(),
	},
}));

vi.mock("@infrastructure/persistence/mongo/mongoSessionContext", () => ({
	mongoSessionContext: {
		getStore: vi.fn(),
	},
}));

function userDoc(overrides?: Partial<UserDoc>): UserDoc {
	return {
		_id: "user-1",
		username: "testuser",
		password: "hashed-pass",
		role: HOUSEHOLD_ROLE,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

function mockExecChain(mockFn: ReturnType<typeof vi.fn>, returnValue: unknown) {
	mockFn.mockReturnValue({
		lean: vi.fn().mockReturnThis(),
		sort: vi.fn().mockReturnThis(),
		exec: vi.fn().mockResolvedValue(returnValue),
	});
}

describe("MongoUserRepository", () => {
	let repository: MongoUserRepository;
	let mockSession: ClientSession;

	beforeEach(() => {
		vi.clearAllMocks();
		repository = new MongoUserRepository();
		mockSession = { id: "test-session" } as unknown as ClientSession;
		vi.mocked(mongoSessionContext.getStore).mockReturnValue(mockSession);
	});

	describe("findById()", () => {
		it("should return a domain User when the document exists", async () => {
			const doc = userDoc({ _id: "alice-id", username: "alice" });
			mockExecChain(vi.mocked(UserModel.findById), doc);

			const result = await repository.findById(validId("alice-id"));

			expect(result).toBeInstanceOf(User);
			expect(result?.id.value).toBe("alice-id");
			expect(result?.username.value).toBe("alice");
		});

		it("should return undefined when the document does not exist", async () => {
			mockExecChain(vi.mocked(UserModel.findById), null);

			const result = await repository.findById(validId("unknown-id"));

			expect(result).toBeUndefined();
		});
	});

	describe("findByUsername()", () => {
		it("should return a domain User when the username exists", async () => {
			const doc = userDoc({ _id: "bob-id", username: "bob" });
			mockExecChain(vi.mocked(UserModel.findOne), doc);

			const result = await repository.findByUsername(validUsername("bob"));

			expect(result).toBeInstanceOf(User);
			expect(result?.username.value).toBe("bob");
			expect(UserModel.findOne).toHaveBeenCalledWith({ username: "bob" });
		});

		it("should return undefined when the username does not exist", async () => {
			mockExecChain(vi.mocked(UserModel.findOne), null);

			const result = await repository.findByUsername(validUsername("unknown"));

			expect(result).toBeUndefined();
		});
	});

	describe("findByRole()", () => {
		it("should return users filtered by role sorted by username", async () => {
			const docs = [
				userDoc({ _id: "id-1", username: "alice" }),
				userDoc({ _id: "id-2", username: "bob" }),
			];
			mockExecChain(vi.mocked(UserModel.find), docs);

			const result = await repository.findByRole(HOUSEHOLD_ROLE);

			expect(result).toHaveLength(2);
			expect(result[0]).toBeInstanceOf(User);
			expect(result[0].id.value).toBe("id-1");
			expect(result[1].id.value).toBe("id-2");
		});

		it("should return an empty array when no users match the role", async () => {
			mockExecChain(vi.mocked(UserModel.find), []);

			const result = await repository.findByRole(UserRoles.ADMIN);

			expect(result).toEqual([]);
		});
	});

	describe("save()", () => {
		it("should upsert the user document within the active session", async () => {
			vi.mocked(UserModel.replaceOne).mockReturnValue({
				exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
			} as never);
			const user = aUser();

			await repository.save(user);

			expect(UserModel.replaceOne).toHaveBeenCalledWith(
				{ _id: "user-1" },
				expect.objectContaining({ _id: "user-1", username: "testuser" }),
				{ upsert: true, runValidators: true, session: mockSession },
			);
		});

		it("should throw UsernameAlreadyExistsError on duplicate key error", async () => {
			vi.mocked(UserModel.replaceOne).mockReturnValue({
				exec: vi.fn().mockRejectedValue(
					new mongoose.mongo.MongoServerError({
						code: 11000,
						message: "duplicate key",
					}),
				),
			} as never);
			const user = aUser();

			await expect(repository.save(user)).rejects.toThrow(
				UsernameAlreadyExistsError,
			);
		});

		it("should rethrow unexpected database errors", async () => {
			const dbError = new Error("connection lost");
			vi.mocked(UserModel.replaceOne).mockReturnValue({
				exec: vi.fn().mockRejectedValue(dbError),
			} as never);

			await expect(repository.save(aUser())).rejects.toThrow("connection lost");
		});
	});

	describe("remove()", () => {
		it("should delete the user by id within the active session", async () => {
			vi.mocked(UserModel.findByIdAndDelete).mockReturnValue({
				exec: vi.fn().mockResolvedValue(undefined),
			} as never);
			const user = aUser();

			await repository.remove(user);

			expect(UserModel.findByIdAndDelete).toHaveBeenCalledWith("user-1", {
				session: mockSession,
			});
		});

		it("should rethrow database errors on remove", async () => {
			const dbError = new Error("delete failed");
			vi.mocked(UserModel.findByIdAndDelete).mockReturnValue({
				exec: vi.fn().mockRejectedValue(dbError),
			} as never);

			await expect(repository.remove(aUser())).rejects.toThrow("delete failed");
		});
	});
});
