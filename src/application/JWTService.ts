import jwt, { SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { TokenService } from "../domain/ports/TokenService";
import { AccessTokenPayload } from "../domain/AccessTokenPayload";

export class JWTService implements TokenService {
  constructor(
    private readonly jwtSecret: string,
    private readonly jwtExpiresIn: StringValue,
    private readonly jwtRefreshExpiresIn: StringValue,
  ) {}

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

  async verifyToken(token: string): Promise<AccessTokenPayload | undefined> {
    try {
      return jwt.verify(token, this.jwtSecret) as AccessTokenPayload;
    } catch {
      return;
    }
  }
}
