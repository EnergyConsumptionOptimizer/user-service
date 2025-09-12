import "dotenv/config";
import express from "express";
import { apiRouter } from "./dependencies";

const app = express();

app.use(express.json());
app.use(apiRouter);

export { app };
