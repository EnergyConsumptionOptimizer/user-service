import { AuthController } from "./controllers/AuthController";
import { AuthServiceImpl } from "../../application/AuthService";
import { JWTService } from "../../application/JWTService";
import { UserController } from "./controllers/UserController";
import { UserServiceImpl } from "../../application/UserServiceImpl";
import { AuthMiddleware } from "./middleware/AuthMiddleware";
import { router } from "./routes/router";
import { MongooseUserRepository } from "../../storage/mongo/MongooseUserRepository";
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
