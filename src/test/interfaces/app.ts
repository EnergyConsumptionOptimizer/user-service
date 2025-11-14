import "dotenv/config";
import express from "express";

import { errorsHandler } from "@interfaces/web-api/middleware/ErrorsMiddleware";
import { apiRouter } from "./dependencies";

const app = express();

app.use(express.json());
app.use(apiRouter);
app.use(errorsHandler);

export { app };
