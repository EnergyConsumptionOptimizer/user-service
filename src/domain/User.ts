import { type UserID } from "./UserID";
import { type UserRole } from "./UserRole";

export interface User {
  id: UserID;
  username: string;
  password: string;
  role: UserRole;
}
