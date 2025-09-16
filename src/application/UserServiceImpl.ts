import { UserService } from "../domain/ports/UserService";
import { UserRepository } from "../domain/ports/UserRepository";
import { User } from "../domain/User";
import { UserID } from "../domain/UserID";
import bcrypt from "bcrypt";
import { UserFactory } from "../domain/UserFactory";

import {
  InvalidResetCodeError,
  UserNotFoundError,
} from "../domain/errors/errors";

export class UserServiceImpl implements UserService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly RESET_CODE: string,
  ) {}

  async getHouseholdUsers(): Promise<User[]> {
    return await this.userRepository.findAllHouseholdUsers();
  }

  async getUser(id: UserID): Promise<User | null> {
    return await this.userRepository.findUserById(id);
  }

  async createHouseholdUser(username: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const newHouseholdUser = new UserFactory().createHouseholdUser(
      username.toLowerCase().trim(),
      hashedPassword,
    );

    return this.userRepository.addNewHouseholdUser(newHouseholdUser);
  }

  async updateHouseholdUsername(id: UserID, username: string): Promise<User> {
    const existingUser = await this.userRepository.findHouseholdUserById(id);

    if (!existingUser) {
      throw new UserNotFoundError();
    }

    const updatedUser: User = {
      ...existingUser,
      username: username.trim(),
    };

    return this.userRepository.updateUser(updatedUser);
  }

  async updatePassword(id: UserID, password: string): Promise<User> {
    const user = await this.userRepository.findUserById(id);

    if (!user) {
      throw new UserNotFoundError();
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const updatedUser: User = {
      ...user,
      password: hashedPassword,
    };

    return this.userRepository.updateUser(updatedUser);
  }

  async deleteHouseholdUser(id: UserID): Promise<void> {
    const existingUser = await this.userRepository.findHouseholdUserById(id);
    if (!existingUser) {
      throw new UserNotFoundError();
    }

    await this.userRepository.removeHouseholdUser(existingUser);
  }

  async resetAdminPassword(resetCode: string, password: string): Promise<User> {
    if (resetCode != this.RESET_CODE) {
      throw new InvalidResetCodeError();
    }

    const admin = await this.userRepository.findUserByUsername("admin");

    if (!admin) {
      throw new UserNotFoundError();
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const updatedUser: User = {
      ...admin,
      password: hashedPassword,
    };

    return this.userRepository.updateUser(updatedUser);
  }
}
