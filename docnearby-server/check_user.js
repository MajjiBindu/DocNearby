import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27015/docnearby';

const UserSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', UserSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');
  
  const users = await User.find({});
  console.log('All Users in DB:');
  users.forEach(u => {
    console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
  });
  
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
