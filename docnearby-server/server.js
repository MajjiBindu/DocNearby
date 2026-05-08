import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import { connectDb } from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDb();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`DocNearby server listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", err);
  process.exit(1);
});

console.log("DIRECT AUTH:", process.env.MSG91_AUTH_KEY);
console.log("DIRECT TEMPLATE:", process.env.MSG91_TEMPLATE_ID);
