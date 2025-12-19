import request, { type Response } from "supertest";
import bcrypt from "bcrypt";
import { app } from "../app";
import { userService, userRepository } from "../dependencies";
import { User } from "@domain/User";
import { UserRole } from "@domain/UserRole";

export interface TestFixture {
  user: User;
  authHeader: string;
  accessToken: string;
  refreshToken: string;
  passwordRaw: string;
}

export async function parseAuthCookies(res: Response | Promise<Response>) {
  const { header } = await res;
  const setCookie = header["set-cookie"];
  if (!setCookie) {
    return { authHeader: "", accessToken: "", refreshToken: "" };
  }
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  const getVal = (name: string) =>
    cookies
      .find((c) => c.trim().startsWith(`${name}=`))
      ?.split(";")[0]
      .split("=")[1] ?? "";

  return {
    authHeader: cookies.map((c) => c.split(";")[0]).join("; "),
    accessToken: getVal("authToken"),
    refreshToken: getVal("refreshToken"),
  };
}

export async function createUser(
  username: string,
  password: string,
  role: UserRole = UserRole.HOUSEHOLD,
) {
  if (role === UserRole.HOUSEHOLD) {
    return userService.createHouseholdUser(username, password);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  return userRepository.saveNewHouseholdUser({
    username,
    password: hashedPassword,
    role,
  } as User);
}

export async function loginUser(username: string, password: string) {
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({ username, password });

  return parseAuthCookies(loginRes);
}

export async function createAndLoginUser(
  params: { username?: string; password?: string; role?: UserRole } = {},
): Promise<TestFixture> {
  const username = params.username || `user-${Date.now()}`;
  const passwordRaw = params.password || "password123";
  const role = params.role || UserRole.HOUSEHOLD;

  const user = await createUser(username, passwordRaw, role);
  const cookies = await loginUser(username, passwordRaw);

  return {
    user,
    ...cookies,
    passwordRaw,
  };
}
