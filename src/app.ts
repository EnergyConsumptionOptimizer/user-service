import express from "express";
import cookieParser from "cookie-parser";
import { apiRouter } from "@interfaces/web-api/dependencies";
import { errorsHandler } from "@interfaces/web-api/middleware/ErrorsMiddleware";

const app = express();

app.use(cookieParser());

app.use(express.json());

app.use(apiRouter);

app.use(errorsHandler);

export default app;
