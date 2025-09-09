import { UserRepository } from "../../domain/ports/UserRepository";
import { User } from "../../domain/User";
import { UserRole } from "../../domain/UserRole";
import { v4 as uuidv4, validate } from "uuid";
import { UserID } from "../../domain/UserID";
import { ConflictError } from "../../domain/errors/ConflictError";
import { NotFoundError } from "../../domain/errors/NotFoundError";

export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async getHouseholdUsers(): Promise<User[]> {
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

  async addNewHouseholdUser(user: User): Promise<User> {
    const id = uuidv4();

    const existingUser = this.users.find((u) => u.username === user.username);
    if (existingUser) {
      throw new ConflictError("Username " + user.username + " already exists");
    }

    const newUser: User = {
      ...user,
      id: new UserID(id),
    };

    this.users.push(newUser);
    return { ...newUser };
  }

  async findUserById(id: UserID): Promise<User | null> {
    this.validateUserID(id.value);

    const user = this.users.find((u) => u.id.value === id.value);
    return user ? { ...user } : null;
  }

  async updateUser(user: User): Promise<User> {
    this.validateUserID(user.id.value);

    const userIndex = this.users.findIndex((u) => u.id.value === user.id.value);

    if (userIndex === -1) {
      throw new NotFoundError("User not found for update");
    }

    const existingUser = this.users.find(
      (u) => u.username === user.username && u.id.value !== user.id.value,
    );

    if (existingUser) {
      throw new ConflictError("Username " + user.username + " already exists");
    }

    const updatedUser: User = {
      id: user.id,
      username: user.username,
      password: user.password,
      role: this.users[userIndex].role,
    };

    this.users[userIndex] = updatedUser;
    return { ...updatedUser };
  }

  async removeUser(user: User): Promise<void> {
    this.validateUserID(user.id.value);

    const userIndex = this.users.findIndex((u) => u.id.value === user.id.value);

    if (userIndex === -1) {
      throw new NotFoundError("User not found for deletion");
    }

    this.users.splice(userIndex, 1);
  }

  private validateUserID(value: string) {
    if (!validate(value)) {
      throw new NotFoundError(`Invalid user ID format: ${value}`);
    }
  }

  public clear(): void {
    this.users = [];
  }
}
