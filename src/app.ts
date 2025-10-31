import express from "express";
import { apiRouter } from "./interfaces/api/dependencies";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

app.use(express.json());
app.use(apiRouter);

app.listen(PORT, async () => {
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
