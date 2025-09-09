import { User } from "../User";
import { AccessToken } from "../AccessToken";

/**
 * Service interface for handling authentication and authorization.
 */
export interface AuthService {
  /**
   * Authenticates a user with their credentials and issues an access token.
   *
   * @param username - The username of the user attempting to log in.
   * @param password - The password of the user.
   * @returns A promise that resolves to a new access token if authentication succeeds.
   */
  login(username: string, password: string): Promise<AccessToken>;

  /**
   * Logs a user out of the system
   *
   * @param username - The username of the user logging out.
   * @returns A promise that resolves once the logout process is complete.
   */
  logout(username: string): Promise<void>;

  /**
   * Verifies the validity of an access token and retrieves the associated user.
   *
   * @param token - The access token to verify.
   * @returns A promise that resolves to the user if the token is valid, or `null` if invalid or expired.
   */
  verify(token: string): Promise<User | null>;

  /**
   * Refreshes an expired or soon-to-expire access token with a new one.
   *
   * @param token - The refresh or access token to exchange.
   * @returns A promise that resolves to a new access token.
   */
  refresh(token: string): Promise<AccessToken>;
}
