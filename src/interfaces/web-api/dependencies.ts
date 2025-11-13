import { MongooseUserRepository } from "@storage/mongo/MongooseUserRepository";
import { JWTService } from "@application/JWTService";
import { AuthServiceImpl } from "@application/AuthService";
import { UserServiceImpl } from "@application/UserServiceImpl";
import { router } from "./routes/router";
import { UserController } from "@interfaces/web-api/controllers/UserController";
import { AuthController } from "@interfaces/web-api/controllers/AuthController";
import { AuthMiddleware } from "@interfaces/web-api/middleware/AuthMiddleware";

// ===== Repository =====
export const userRepository = new MongooseUserRepository();

// ===== Services =====
export const jwtService = new JWTService();

export const authService = new AuthServiceImpl(userRepository, jwtService);
export const userService = new UserServiceImpl(
  userRepository,
  process.env.RESET_CODE || "1234",
);

// ===== Controllers =====
export const authController = new AuthController(authService);
export const userController = new UserController(userService);

// ===== Middleware =====
export const authMiddleware = new AuthMiddleware(authService);

// ===== Router =====
export const apiRouter = router(authController, authMiddleware, userController);
