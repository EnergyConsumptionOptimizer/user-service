import { type User } from "./User";
import { UserRole } from "./UserRole";

export class UserFactory {
  createHouseholdUser(username: string, password: string): User {
    return {
      id: { value: "" },
      username,
      password,
      role: UserRole.HOUSEHOLD,
    };
  }
}
