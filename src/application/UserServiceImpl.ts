import { UserService } from "@domain/ports/UserService";
import { UserRepository } from "@domain/ports/UserRepository";
import { User } from "@domain/User";
import { UserID } from "@domain/UserID";
import bcrypt from "bcrypt";
import { UserFactory } from "@domain/UserFactory";
import {
  InvalidResetCodeError,
  UserNotFoundError,
} from "@domain/errors/errors";
import { MonitoringService } from "@application/port/MonitoringService";

export class UserServiceImpl implements UserService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly monitoringService: MonitoringService,
    private readonly RESET_CODE: string,
  ) {}

  async getHouseholdUsers(): Promise<User[]> {
    return this.userRepository.findAllHouseholdUsers();
  }

  async getUser(id: UserID): Promise<User | null> {
    return this.userRepository.findUserById(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.userRepository.findUserByUsername(username);
  }

  async createHouseholdUser(username: string, password: string): Promise<User> {
    const newHouseholdUser = new UserFactory().createHouseholdUser(
      username.toLowerCase().trim(),
      await bcrypt.hash(password, this.SALT_ROUNDS),
    );

    return this.userRepository.saveNewHouseholdUser(newHouseholdUser);
  }

  async updateHouseholdUsername(id: UserID, username: string): Promise<User> {
    const existingUser = await this.userRepository.findHouseholdUserById(id);

    if (!existingUser) {
      throw new UserNotFoundError();
    }

    const currentUsername = existingUser.username;

    const updatedUser: User = {
      ...existingUser,
      username: username.trim(),
    };

    await this.monitoringService.removeHouseholdUserFromMeasurements(
      currentUsername,
    );

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
    const user = await this.userRepository.findUserById(id);

    if (!user) {
      throw new UserNotFoundError();
    }
    const currentUsername = user.username;

    await this.userRepository.removeHouseholdUser(id);

    await this.monitoringService.removeHouseholdUserFromMeasurements(
      currentUsername,
    );
  }

  async resetAdminPassword(resetCode: string, password: string): Promise<User> {
    if (resetCode != this.RESET_CODE) {
      throw new InvalidResetCodeError();
    }

    const admin = await this.userRepository.findUserByUsername("admin");

    if (!admin) {
      throw new UserNotFoundError();
    }

    const updatedUser: User = {
      ...admin,
      password: await bcrypt.hash(password, this.SALT_ROUNDS),
    };

    return this.userRepository.updateUser(updatedUser);
  }
}
