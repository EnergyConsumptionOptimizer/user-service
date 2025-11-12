import { type UserID } from "../UserID";
import { type User } from "../User";

/**
 * Service interface for managing users.
 */
export interface UserService {
  /**
   * Retrieves all household users.
   *
   * @returns A promise that resolves to an array of household users.
   */
  getHouseholdUsers(): Promise<User[]>;

  /**
   * Retrieves a single user by their unique identifier.
   *
   * @param id - The unique identifier of the user.
   * @returns A promise that resolves to the user if found, or `null` otherwise.
   */
  getUser(id: UserID): Promise<User | null>;

  /**
   * Retrieves a single user by their unique username.
   *
   * @param username - The unique username of the user.
   * @returns A promise that resolves to the user if found, or `null` otherwise.
   */
  getUserByUsername(username: string): Promise<User | null>;

  /**
   * Updates the username of a household user.
   *
   * @param id - The unique identifier of the household user.
   * @param username - The new username to assign.
   * @returns A promise that resolves to the updated user.
   */
  updateHouseholdUsername(id: UserID, username: string): Promise<User>;

  /**
   * Updates the password of a user.
   *
   * @param id - The unique identifier of the user.
   * @param password - The new password to set.
   * @returns A promise that resolves to the updated user.
   */
  updatePassword(id: UserID, password: string): Promise<User>;

  /**
   * Creates a new household user with the given username and password.
   *
   * @param username - The username of the new user.
   * @param password - The password of the new user.
   * @returns A promise that resolves to the newly created user.
   */
  createHouseholdUser(username: string, password: string): Promise<User>;

  /**
   * Deletes an existing household user by their unique identifier.
   *
   * @param id - The unique identifier of the household user to delete.
   * @returns A promise that resolves once the household user has been removed.
   */
  deleteHouseholdUser(id: UserID): Promise<void>;

  /**
   * Resets the admin's password using a valid reset code.
   *
   * @param resetCode - The reset code issued for password recovery.
   * @param password - The new password to assign to the admin.
   * @returns A promise that resolves to the updated admin user.
   */
  resetAdminPassword(resetCode: string, password: string): Promise<User>;
}
