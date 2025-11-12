import { UserRepository } from "@domain/port/UserRepository";
import { User } from "@domain/User";
import { UserRole } from "@domain/UserRole";
import { UserID } from "@domain/UserID";
import { v4 as uuidv4, validate } from "uuid";
import {
  InvalidIDError,
  UsernameConflictError,
  UserNotFoundError,
} from "@domain/errors/errors";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async findAllHouseholdUsers(): Promise<User[]> {
    return this.users
      .filter((user) => user.role === UserRole.HOUSEHOLD)
      .map((user) => ({ ...user }));
  }

  async findUserByUsername(username: string): Promise<User | null> {
    try {
      const user = this.users.find((u) => u.username === username);
      return user ? { ...user } : null;
    } catch {
      return null;
    }
  }

  async findUserById(id: UserID): Promise<User | null> {
    this.validateUserID(id.value);

    const user = this.users.find((u) => u.id.value === id.value);
    return user ? { ...user } : null;
  }

  async findHouseholdUserById(id: UserID) {
    this.validateUserID(id.value);

    const user = this.users.find(
      (u) => u.id.value === id.value && u.role === UserRole.HOUSEHOLD,
    );
    return user ? { ...user } : null;
  }

  async saveNewHouseholdUser(user: User): Promise<User> {
    const id = uuidv4();

    const existingUser = this.users.find((u) => u.username === user.username);

    if (existingUser) {
      throw new UsernameConflictError(user.username);
    }

    const newUser: User = {
      ...user,
      id: { value: id },
    };

    this.users.push(newUser);
    return { ...newUser };
  }

  async updateUser(user: User): Promise<User> {
    this.validateUserID(user.id.value);

    const userIndex = this.users.findIndex((u) => u.id.value === user.id.value);

    if (userIndex === -1) {
      throw new UserNotFoundError();
    }

    const existingUser = this.users.find(
      (u) => u.username === user.username && u.id.value !== user.id.value,
    );

    if (existingUser) {
      throw new UsernameConflictError(user.username);
    }

    const currentUser = this.users[userIndex];

    const updatedUser: User = {
      id: currentUser.id,
      username:
        currentUser.role === UserRole.ADMIN
          ? currentUser.username
          : user.username,
      password: user.password,
      role: currentUser.role,
    };

    this.users[userIndex] = updatedUser;

    return { ...updatedUser };
  }

  async removeHouseholdUser(id: UserID): Promise<void> {
    this.validateUserID(id.value);

    const userIndex = this.users.findIndex(
      (u) => u.id.value === id.value && u.role === UserRole.HOUSEHOLD,
    );

    if (userIndex === -1) {
      throw new UserNotFoundError();
    }

    this.users.splice(userIndex, 1);
  }

  private validateUserID(value: string) {
    if (!validate(value)) {
      throw new InvalidIDError();
    }
  }

  public clear(): void {
    this.users = [];
  }
}
