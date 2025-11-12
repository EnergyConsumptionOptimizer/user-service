import { type User } from "../User";
import { type UserID } from "../UserID";

/**
 * Repository interface for managing and retrieving user entities.
 */
export interface UserRepository {
  /**
   * Finds a user by their unique username.
   *
   * @param username - The username to search for.
   * @returns A promise that resolves to the user if found, or `null` if no user exists with the given username.
   */
  findUserByUsername(username: string): Promise<User | null>;

  /**
   * Finds a user by their unique identifier.
   *
   * @param id - The unique user identifier.
   * @returns A promise that resolves to the user if found, or `null` if no user exists with the given ID.
   */
  findUserById(id: UserID): Promise<User | null>;

  /**
   * Finds a household user by their unique identifier.
   *
   * @param id - The unique household user identifier.
   * @returns A promise that resolves to the household user if found, or `null` if no user exists with the given ID.
   */
  findHouseholdUserById(id: UserID): Promise<User | null>;

  /**
   * Retrieves all household users.
   *
   * @returns A promise that resolves to an array of household users.
   */
  findAllHouseholdUsers(): Promise<User[]>;

  /**
   * Updates the details of a user.
   *
   * @param user - The user entity with updated information.
   * @returns A promise that resolves to the updated user.
   */
  updateUser(user: User): Promise<User>;

  /**
   * Saves a new household user.
   *
   * @param user - The new household user to add.
   * @returns A promise that resolves to the created household user.
   */
  saveNewHouseholdUser(user: User): Promise<User>;

  /**
   * Removes a household user from the repository.
   *
   * @param id - The id of the user to remove.
   * @returns A promise that resolves once the user has been removed.
   */
  removeHouseholdUser(id: UserID): Promise<void>;
}
