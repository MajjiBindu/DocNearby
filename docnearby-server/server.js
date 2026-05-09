import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5000;

function validateStartupEnv() {
  const required = ["EMAIL_USER", "EMAIL_PASS", "JWT_SECRET"];
  const missing = required.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(
      `[ERROR] Missing required environment variables: ${missing.join(", ")}. ` +
        "Set them in docnearby-server/.env before starting the server.",
    );
  }
}

async function start() {
  validateStartupEnv();

  const [{ default: app }, { connectDb }, { User }] = await Promise.all([
    import("./src/app.js"),
    import("./src/config/db.js"),
    import("./src/models/User.js"),
    import("./src/jobs/reminderJob.js"),
  ]);

  await connectDb();
  await syncUserIndexes(User);
  const { startReminderJob } = await import("./src/jobs/reminderJob.js");
  startReminderJob();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`DocNearby server listening on http://localhost:${PORT}`);
  });
}

async function syncUserIndexes(User) {
  console.log("[AUTH] Checking users collection indexes");
  const indexes = await User.collection.indexes();
  const hasLegacyPhoneIndex = indexes.some((index) => index.name === "phone_1");

  if (hasLegacyPhoneIndex) {
    console.log("[AUTH] Dropping legacy users.phone_1 index");
    await User.collection.dropIndex("phone_1");
    console.log("[AUTH] Dropped legacy users.phone_1 index");
  }

  await User.syncIndexes();
  console.log("[AUTH] User indexes synchronized");
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[ERROR] Failed to start server:", err.message);
  process.exit(1);
});
