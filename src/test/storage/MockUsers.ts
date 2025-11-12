import { UserRole } from "@domain/UserRole";
import { UserFactory } from "@domain/UserFactory";

export const mockAdminUser = {
  id: { value: "" },
  username: "admin",
  password: "admin",
  role: UserRole.ADMIN,
};

export const mockHouseholdUserMark = new UserFactory().createHouseholdUser(
  "mark",
  "password",
);

export const mockHouseholdUserDavid = new UserFactory().createHouseholdUser(
  "david",
  "password",
);

export const mockHouseholdUserEmma = new UserFactory().createHouseholdUser(
  "emma",
  "password",
);
