import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const UserSchema = new mongoose.Schema({}, { strict: false });
const DoctorSchema = new mongoose.Schema({}, { strict: false });
const ClinicSchema = new mongoose.Schema({}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Doctor = mongoose.model('Doctor', DoctorSchema);
const Clinic = mongoose.model('Clinic', ClinicSchema);

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  // Check if user already exists
  let user = await User.findOne({ email: 'bindumadhavi6281@gmail.com' });
  if (user) {
    console.log('User already exists, deleting first to re-create...');
    await Doctor.deleteOne({ userId: user._id });
    await User.deleteOne({ _id: user._id });
  }

  const hashedPassword = await bcrypt.hash('Bindu8008', 12);
  user = await User.create({
    email: 'bindumadhavi6281@gmail.com',
    password: hashedPassword,
    name: 'Dr. Bindu Madhavi',
    role: 'doctor',
    isEmailVerified: true,
    emailVerifiedAt: new Date()
  });
  console.log('User created:', user._id);

  const clinic = await Clinic.findOne({});
  const doctor = await Doctor.create({
    userId: user._id,
    specialty: 'General Physician',
    profilePhoto: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=300',
    bio: '', // Empty to trigger incomplete checklist
    qualifications: [], // Empty to trigger incomplete checklist
    languages: ['Hindi', 'English'],
    consultationFee: 500,
    experience: 5,
    clinicId: clinic ? clinic._id : null,
    availableSlots: [], // Empty to trigger incomplete checklist
    isVerified: true,
    rating: 4.5,
    reviewCount: 0
  });
  console.log('Doctor profile created:', doctor._id);

  if (clinic) {
    clinic.doctors = clinic.doctors || [];
    clinic.doctors.push(doctor._id);
    await clinic.save();
    console.log('Linked doctor to clinic:', clinic.name);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
