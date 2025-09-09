import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { TokenService } from "../domain/ports/TokenService";
import { AccessTokenPayload } from "../domain/AccessTokenPayload";

export class JWTService implements TokenService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: StringValue;
  private readonly jwtRefreshExpiresIn: StringValue;

  constructor(
    jwtSecret = process.env.JWT_SECRET,
    jwtExpiresIn = process.env.JWT_EXPIRES_IN,
    jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN,
  ) {
    if (!jwtSecret) {
      throw new Error("JWT_SECRET must be defined in the .env file");
    }
    if (!jwtExpiresIn) {
      throw new Error("JWT_EXPIRES_IN must be defined in the .env file");
    }
    if (!jwtRefreshExpiresIn) {
      throw new Error(
        "JWT_REFRESH_EXPIRES_IN must be defined in the .env file",
      );
    }

    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn as StringValue;
    this.jwtRefreshExpiresIn = jwtRefreshExpiresIn as StringValue;
  }

  private generateJWT(
    payload: AccessTokenPayload,
    expiresIn: StringValue,
  ): string {
    const options: SignOptions = { expiresIn };
    return jwt.sign(payload, this.jwtSecret, options);
  }

  async generateAccessToken(payload: AccessTokenPayload): Promise<string> {
    return this.generateJWT(payload, this.jwtExpiresIn);
  }

  async generateRefreshToken(payload: AccessTokenPayload): Promise<string> {
    return this.generateJWT(payload, this.jwtRefreshExpiresIn);
  }

  async verifyToken(token: string): Promise<AccessTokenPayload | null> {
    try {
      return jwt.verify(token, this.jwtSecret) as AccessTokenPayload;
    } catch {
      return null;
    }
  }
}
