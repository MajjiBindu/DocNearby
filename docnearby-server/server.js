import dotenv from "dotenv";
import logger from './src/utils/logger.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

function validateStartupEnv() {
  const required = ["EMAIL_USER", "EMAIL_PASS", "JWT_SECRET"];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length) {
    logger.error(`Missing required environment variables: ${missing.join(", ")}`);
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

async function start() {
  validateStartupEnv();

  const [{ default: app }, { connectDb }, { User }] = await Promise.all([
    import("./src/app.js"),
    import("./src/config/db.js"),
    import("./src/models/User.js"),
  ]);

  await connectDb();
  await syncUserIndexes(User);
  
  const { startReminderJob } = await import("./src/jobs/reminderJob.js");
  startReminderJob();

  const server = app.listen(PORT, () => {
    logger.info(`DocNearby server listening on http://localhost:${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', err);
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', err);
    server.close(() => {
      process.exit(1);
    });
  });
}

async function syncUserIndexes(User) {
  logger.info("Checking users collection indexes");
  const indexes = await User.collection.indexes();
  const hasLegacyPhoneIndex = indexes.some((index) => index.name === "phone_1");

  if (hasLegacyPhoneIndex) {
    logger.info("Dropping legacy users.phone_1 index");
    await User.collection.dropIndex("phone_1");
  }

  await User.syncIndexes();
  logger.info("User indexes synchronized");
}

start().catch((err) => {
  logger.error("Failed to start server:", err);
  process.exit(1);
});
