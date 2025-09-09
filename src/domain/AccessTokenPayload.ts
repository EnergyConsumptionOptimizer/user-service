import { UserID } from "./UserID";
import { UserRole } from "./UserRole";

export interface AccessTokenPayload {
  id: UserID;
  username: string;
  role: UserRole;
}
