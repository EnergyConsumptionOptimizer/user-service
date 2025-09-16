import { InMemoryUserRepository } from "../storage/InMemoryUserRepository";
import { JWTService } from "../../application/JWTService";
import { AuthServiceImpl } from "../../application/AuthService";
import { UserServiceImpl } from "../../application/UserServiceImpl";
import { AuthController } from "../../interfaces/api/controllers/AuthController";
import { UserController } from "../../interfaces/api/controllers/UserController";
import { AuthMiddleware } from "../../interfaces/api/middleware/AuthMiddleware";
import { router } from "../../interfaces/api/routes/router";

export const JWT_SECRET = "test_secret_key";
export const JWT_EXPIRES_IN = "1h";
export const JWT_REFRESH_EXPIRES_IN = "7d";
export const RESET_CODE = "secret_reset_code";

// ===== Repository =====
export const userRepository = new InMemoryUserRepository();

// ===== Services =====
export const jwtService = new JWTService(
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
);
export const authService = new AuthServiceImpl(userRepository, jwtService);
export const userService = new UserServiceImpl(userRepository, RESET_CODE);

// ===== Controllers =====
export const authController = new AuthController(authService);
export const userController = new UserController(userService);

// ===== Middleware =====
export const authMiddleware = new AuthMiddleware(authService);

// ===== Router =====
export const apiRouter = router(authController, authMiddleware, userController);
