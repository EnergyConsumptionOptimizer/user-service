import { AuthController } from "./controllers/AuthController";
import { AuthServiceImpl } from "../../application/AuthService";
import { InMemoryUserRepository } from "../../test/storage/InMemoryUserRepository";
import { JWTService } from "../../application/JWTService";
import { UserController } from "./controllers/UserController";
import { UserServiceImpl } from "../../application/UserServiceImpl";
import { AuthMiddleware } from "./middleware/AuthMiddleware";
import { router } from "./routes/router";

// ===== Repository =====
export const userRepository = new InMemoryUserRepository();

// ===== Services =====
export const jwtService = new JWTService();
export const authService = new AuthServiceImpl(userRepository, jwtService);
export const userService = new UserServiceImpl(userRepository);

// ===== Controllers =====
export const authController = new AuthController(authService);
export const userController = new UserController(userService);

// ===== Middleware =====
export const authMiddleware = new AuthMiddleware(authService);

// ===== Router =====
export const apiRouter = router(authController, authMiddleware, userController);
