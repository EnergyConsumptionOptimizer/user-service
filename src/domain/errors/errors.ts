export class UsernameConflictError extends Error {
  constructor(username: string) {
    super(`Username ${username} already exists`);
    this.name = "UsernameConflictError";
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super("User not found");
    this.name = "UserNotFound";
  }
}

export class InvalidIDError extends Error {
  constructor() {
    super("Invalid user ID format");
    this.name = "InvalidIDError";
  }
}
