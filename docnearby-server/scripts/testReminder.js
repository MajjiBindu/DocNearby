/**
 * standalone test script for appointment reminders
 * Run with: node docnearby-server/scripts/testReminder.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { runReminderJob } from '../src/jobs/reminderJob.js';

async function test() {
  try {
    console.log('--- TEST: Manual Reminder Trigger ---');
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('ERROR: MONGO_URI or MONGODB_URI not found in .env');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected.');

    const results = await runReminderJob();
    console.log('--- TEST COMPLETED ---');
    console.log('Results:', results);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('--- TEST FAILED ---');
    console.error(err);
    process.exit(1);
  }
}

test();
