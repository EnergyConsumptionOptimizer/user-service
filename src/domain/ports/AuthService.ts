import { AccessToken } from "../AccessToken";
import { AccessTokenPayload } from "../AccessTokenPayload";
import { RefreshResponse } from "@domain/ports/RefreshResponse";

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
   * Validates an access token and extracts its payload.
   *
   * @param token - The JWT to validate.
   * @returns A promise that resolves with the decoded payload if valid,
   *          or `null` if the token is invalid or expired.
   */
  verify(token: string): Promise<AccessTokenPayload | undefined>;

  /**
   * Refreshes an expired or soon-to-expire access token with a new one.
   *
   * @param token - The refresh or access token to exchange.
   * @returns A promise that resolves to a new access token.
   */
  refresh(token: string): Promise<RefreshResponse>;
}
