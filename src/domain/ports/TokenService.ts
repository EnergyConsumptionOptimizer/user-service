import { AccessTokenPayload } from "../AccessTokenPayload";

/**
 * Service for managing JWT access and refresh tokens
 */
export interface TokenService {
  /**
   * Generates a new access token with the given payload
   * @param payload - The data to encode in the token
   * @returns Promise resolving to the JWT string
   */
  generateAccessToken(payload: AccessTokenPayload): Promise<string>;

  /**
   * Generates a new refresh token with the given payload
   * @param payload - The data to encode in the token
   * @returns Promise resolving to the JWT string
   */
  generateRefreshToken(payload: AccessTokenPayload): Promise<string>;

  /**
   * Verifies and decodes a token
   * @param token - The JWT string to verify
   * @returns Promise resolving to the payload if valid
   */
  verifyToken(token: string): Promise<AccessTokenPayload | undefined>;
}
