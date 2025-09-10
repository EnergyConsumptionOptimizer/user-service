export class UsernameConflictError extends Error {
  constructor(username: string) {
    super(`Username ${username} already exists`);
    this.name = "UsernameConflictError";
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super("User not found");
    this.name = "UserNotFoundError";
  }
}

export class InvalidIDError extends Error {
  constructor() {
    super("Invalid user ID format");
    this.name = "InvalidIDError";
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Invalid refresh token");
    this.name = "InvalidRefreshTokenError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
    this.name = "InvalidCredentialsError";
  }
}

export class InvalidResetCodeError extends Error {
  constructor() {
    super("Invalid reset code");
    this.name = "InvalidResetCodeError";
  }
}
