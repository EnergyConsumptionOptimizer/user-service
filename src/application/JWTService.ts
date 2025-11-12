import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { TokenService } from "@domain/port/TokenService";
import { AccessTokenPayload } from "@domain/AccessTokenPayload";

export class JWTService implements TokenService {
  constructor(
    private readonly jwtSecret: string = process.env.JWT_SECRET_KEY ||
      "your-secret-key",
    private readonly jwtExpiresIn: string = process.env.JWT_EXPIRES_IN || "1h",
    private readonly jwtRefreshExpiresIn: string = process.env
      .JWT_REFRESH_EXPIRES_IN || "7d",
  ) {}

  private generateJWT(
    payload: AccessTokenPayload,
    expiresIn: StringValue,
  ): string {
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, this.jwtSecret, options);
  }

  async generateAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.generateJWT(payload, this.jwtExpiresIn as StringValue);
  }

  async generateRefreshToken(payload: AccessTokenPayload): Promise<string> {
    return this.generateJWT(payload, this.jwtRefreshExpiresIn as StringValue);
  }

  async verifyToken(token: string): Promise<AccessTokenPayload | undefined> {
    try {
      return jwt.verify(token, this.jwtSecret) as AccessTokenPayload;
    } catch {
      return;
    }
  }
}
