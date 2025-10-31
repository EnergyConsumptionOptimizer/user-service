import express from "express";
import { apiRouter } from "./interfaces/api/dependencies";
import mongoose from "mongoose";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

app.use(express.json());
app.use(apiRouter);

const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

  console.log("Connecting to MongoDB...");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB successfully");

  console.log(`Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`Users API: http://localhost:${PORT}/api/users`);
  console.log(`Admin API: http://localhost:${PORT}/api/admin`);
  console.log(
    `Household users API: http://localhost:${PORT}/api/household-users`,
  );
});

process.on("SIGTERM", shutDown);
process.on("SIGINT", shutDown);

function shutDown() {
  console.log("Received kill signal, shutting down gracefully");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
}
