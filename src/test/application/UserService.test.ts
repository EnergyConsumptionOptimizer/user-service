import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { InMemoryUserRepository } from "../storage/InMemoryUserRepository";
import { UserServiceImpl } from "@application/UserServiceImpl";
import {
  mockAdminUser,
  mockHouseholdUserDavid,
  mockHouseholdUserMark,
} from "../storage/MockUsers";
import { UserRole } from "@domain/UserRole";
import bcrypt from "bcrypt";
import { User } from "@domain/User";
import { v4 as uuidv4 } from "uuid";
import {
  InvalidResetCodeError,
  UsernameConflictError,
  UserNotFoundError,
} from "@domain/errors/errors";
import { UserService } from "@domain/ports/UserService";
import { monitoringService } from "../interfaces/dependencies";

describe("UserService", () => {
  let userService: UserService;
  let repository: InMemoryUserRepository;

  const RESET_CODE = "1234";

  beforeAll(() => {
    repository = new InMemoryUserRepository();
    userService = new UserServiceImpl(
      repository,
      monitoringService,
      RESET_CODE,
    );
  });

  describe("createHouseholdUser", () => {
    beforeEach(() => {
      repository.clear();
    });

    it("should add new household user to the repository", async () => {
      const householdUser = mockHouseholdUserMark;

      const result = await userService.createHouseholdUser(
        householdUser.username,
        householdUser.password,
      );

      expect(result.id.value).not.toBe("");
      expect(result.username).toBe(householdUser.username);
      expect(result.role).toBe(UserRole.HOUSEHOLD);
    });

    it("should hash the password and format the username", async () => {
      const username = "Username";
      const password = "password";

      const result = await userService.createHouseholdUser(username, password);

      const passwordMatch = await bcrypt.compare(password, result.password);

      expect(passwordMatch).toBe(true);
      expect(result.username).toBe("username");
    });
  });

  describe("getUser", () => {
    let householdUser: User;

    beforeAll(async () => {
      repository.clear();

      householdUser = await repository.saveNewHouseholdUser(
        mockHouseholdUserMark,
      );
    });

    it("should return user when valid ID exist", async () => {
      const result = await userService.getUser(householdUser.id);

      expect(result).not.toBeNull();
      expect(result?.username).toBe(householdUser.username);
    });

    it("should return null when ID does not exist", async () => {
      const result = await userService.getUser({ value: uuidv4() });
      expect(result).toBeNull();
    });
  });

  describe("getHouseholdUsers", () => {
    beforeAll(() => {
      repository.clear();
    });

    it("should return the household users from the repository", async () => {
      await repository.saveNewHouseholdUser(mockHouseholdUserMark);
      await repository.saveNewHouseholdUser(mockHouseholdUserDavid);

      const result = await userService.getHouseholdUsers();

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe(UserRole.HOUSEHOLD);
    });
  });

  describe("updateHouseholdUsername", () => {
    let householdUser: User;

    beforeAll(async () => {
      repository.clear();
      householdUser = await repository.saveNewHouseholdUser(
        mockHouseholdUserMark,
      );
    });

    it("should update household user's username successfully", async () => {
      const newUsername = "alex";
      const result = await userService.updateHouseholdUsername(
        householdUser.id,
        newUsername,
      );

      expect(result.username).toBe(newUsername);
    });

    it("should throw error when user not found", async () => {
      await expect(
        userService.updateHouseholdUsername({ value: uuidv4() }, "username"),
      ).rejects.toThrow(UserNotFoundError);
    });

    it("should throw error trying to update admin username", async () => {
      const admin = await repository.saveNewHouseholdUser(mockAdminUser);
      await expect(
        userService.updateHouseholdUsername(admin.id, "username"),
      ).rejects.toThrow(UserNotFoundError);
    });

    it("should throw ConflictError when new username conflicts", async () => {
      const newUser = await repository.saveNewHouseholdUser(
        mockHouseholdUserDavid,
      );

      await expect(
        userService.updateHouseholdUsername(householdUser.id, newUser.username),
      ).rejects.toThrow(UsernameConflictError);
    });
  });

  describe("updatePassword", () => {
    let householdUser: User;

    beforeAll(async () => {
      repository.clear();
      householdUser = await repository.saveNewHouseholdUser(
        mockHouseholdUserMark,
      );
    });

    it("should update user's password successfully", async () => {
      const newPassword = "password123";
      const result = await userService.updatePassword(
        householdUser.id,
        newPassword,
      );

      const passwordMatch = await bcrypt.compare(newPassword, result.password);

      expect(passwordMatch).toBe(true);
    });

    it("should throw error when user not found", async () => {
      await expect(
        userService.updatePassword({ value: uuidv4() }, "password"),
      ).rejects.toThrow(UserNotFoundError);
    });
  });

  describe("resetAdminPassword", async () => {
    beforeAll(async () => {
      repository.clear();
      await repository.saveNewHouseholdUser(mockAdminUser);
    });

    it("should reset admins password when valid code is provided", async () => {
      const newPassword = "admin123";

      if (!RESET_CODE) {
        expect.fail();
      }

      const result = await userService.resetAdminPassword(
        RESET_CODE,
        newPassword,
      );

      const passwordMatch = await bcrypt.compare(newPassword, result.password);

      expect(passwordMatch).toBe(true);
    });

    it("should throw error when invalid code is provided", async () => {
      if (!RESET_CODE) {
        expect.fail();
      }

      await expect(
        userService.resetAdminPassword(RESET_CODE + "0000", "password"),
      ).rejects.toThrow(InvalidResetCodeError);
    });
  });

  describe("deleteUser", () => {
    let householdUser: User;

    beforeAll(async () => {
      repository.clear();

      householdUser = await repository.saveNewHouseholdUser(
        mockHouseholdUserMark,
      );
    });

    it("should delete user successfully", async () => {
      await userService.deleteHouseholdUser(householdUser.id);

      const result = await repository.findUserById(householdUser.id);
      expect(result).toBeNull();
    });

    it("should throw error when user not found", async () => {
      await expect(
        userService.deleteHouseholdUser({ value: uuidv4() }),
      ).rejects.toThrow(UserNotFoundError);
    });
  });
});
