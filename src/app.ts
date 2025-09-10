import "dotenv/config";
import express from "express";
import routes from "./interfaces/routes/routes";

const app = express();
app.use(express.json());

const startServer = async () => {
  try {
    app.use(routes);

    app.listen(process.env.PORT, () => {
      console.log(`Server on http://localhost:${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
