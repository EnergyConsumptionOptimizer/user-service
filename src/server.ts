import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";

const config = {
  port: process.env.PORT || 3000,
  mongoUri:
    process.env.MONGO_URI ||
    `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGO_DB}`,
};

if (!config.mongoUri) {
  console.error("MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
};

const launchServer = () => {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

const start = async () => {
  await connectDatabase();
  launchServer();
};

start();
