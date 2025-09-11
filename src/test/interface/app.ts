import "dotenv/config";
import express from "express";
import router from "../../interfaces/api/routes/Router";

const app = express();

app.use(express.json());
app.use(router);

export { app };
