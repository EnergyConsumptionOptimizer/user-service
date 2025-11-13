import { type User } from "@domain/User";
import { type UserDTO } from "./UserDTO";

export const UserMapper = {
  toDTO(user: User): UserDTO {
    return {
      id: user.id.value.toString(),
      username: user.username,
      role: user.role,
    };
  },
};
