import { InMemoryUserRepository } from "../storage/InMemoryUserRepository";
import { JWTService } from "@application/JWTService";
import { AuthServiceImpl } from "@application/AuthService";
import { UserServiceImpl } from "@application/UserServiceImpl";
import { AuthController } from "@interfaces/web-api/controllers/AuthController";
import { UserController } from "@interfaces/web-api/controllers/UserController";
import { AuthMiddleware } from "@interfaces/web-api/middleware/AuthMiddleware";
import { router } from "@interfaces/web-api/routes/router";
import { MonitoringServiceImpl } from "@interfaces/MonitoringServiceImpl";
import { vi } from "vitest";

export const RESET_CODE = "secret_reset_code";

// ===== Repository =====
export const userRepository = new InMemoryUserRepository();

// ===== Services =====
export const jwtService = new JWTService();
export const monitoringService = new MonitoringServiceImpl();
monitoringService.removeHouseholdUserFromMeasurements = vi
  .fn()
  .mockResolvedValue(undefined);

export const authService = new AuthServiceImpl(userRepository, jwtService);
export const userService = new UserServiceImpl(
  userRepository,
  monitoringService,
  RESET_CODE,
);

// ===== Controllers =====
export const authController = new AuthController(authService);
export const userController = new UserController(userService);

// ===== Middleware =====
export const authMiddleware = new AuthMiddleware(authService);

// ===== Router =====
export const apiRouter = router(authController, authMiddleware, userController);
