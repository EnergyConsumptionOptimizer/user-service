import { AccessToken } from "@domain/AccessToken";
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  UserNotFoundError,
} from "@domain/errors/errors";
import { AccessTokenPayload } from "@domain/AccessTokenPayload";
import { compare } from "bcrypt";
import { AuthService } from "@domain/ports/AuthService";
import { UserRepository } from "@domain/ports/UserRepository";
import { TokenService } from "@domain/ports/TokenService";

export class AuthServiceImpl implements AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async login(username: string, password: string): Promise<AccessToken> {
    const user = await this.userRepository.findUserByUsername(
      username.toLowerCase(),
    );

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const userPayload: AccessTokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
    };

    const accessToken =
      await this.tokenService.generateAccessToken(userPayload);
    const refreshToken =
      await this.tokenService.generateRefreshToken(userPayload);

    return { accessToken: accessToken, refreshToken: refreshToken };
  }

  async logout(username: string): Promise<void> {
    const user = await this.userRepository.findUserByUsername(username);

    if (!user) {
      throw new UserNotFoundError();
    }
  }

  async refresh(token: string): Promise<AccessToken> {
    const payload = await this.tokenService.verifyToken(token);

    if (!payload) {
      throw new InvalidRefreshTokenError();
    }

    const userPayload: AccessTokenPayload = {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    };

    const accessToken =
      await this.tokenService.generateAccessToken(userPayload);
    const refreshToken =
      await this.tokenService.generateRefreshToken(userPayload);

    return { accessToken: accessToken, refreshToken: refreshToken };
  }

  async verify(token: string): Promise<AccessTokenPayload | undefined> {
    return this.tokenService.verifyToken(token);
  }
}
