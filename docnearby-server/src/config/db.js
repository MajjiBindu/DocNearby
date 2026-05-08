import mongoose from "mongoose";
import { env } from "./constants.js";

export async function connectDb() {
  const uri = env("MONGODB_URI", env("MONGO_URI"));
  if (!uri) throw new Error("MONGODB_URI or MONGO_URI is required");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}
