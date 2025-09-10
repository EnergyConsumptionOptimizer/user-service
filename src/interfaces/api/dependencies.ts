import { AuthController } from "./controller/AuthController";
import { AuthServiceImpl } from "../../application/AuthService";
import { InMemoryUserRepository } from "../../test/storage/InMemoryUserRepository";
import { JWTService } from "../../application/JWTService";
import { UserController } from "./controller/UserController";
import { UserServiceImpl } from "../../application/UserServiceImpl";
import { AuthMiddleware } from "./middleware/AuthMiddleware";

// ===== Services =====
const userRepository = new InMemoryUserRepository();
const jwtService = new JWTService();

const authService = new AuthServiceImpl(userRepository, jwtService);
const userService = new UserServiceImpl(userRepository);

// ===== Controllers =====
export const authController = new AuthController(authService);
export const userController = new UserController(userService);

// ===== Middleware =====
export const authMiddleware = new AuthMiddleware(authService);
