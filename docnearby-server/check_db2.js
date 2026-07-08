import mongoose from 'mongoose';
import { Clinic } from './src/models/Clinic.js';
import { Doctor } from './src/models/Doctor.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect('mongodb+srv://bindumadhavi6281:fX3lR6HlP2oF8Dq1@cluster0.egzyvcv.mongodb.net/docnearby?retryWrites=true&w=majority');
  
  const clinics = await Clinic.find({ city: 'Srikakulam' });
  console.log('Clinics in Srikakulam:', clinics.map(c => ({
    id: c._id,
    name: c.name,
    location: c.location
  })));
  
  const doctor = await Doctor.findOne({}).populate('clinicId');
  if (doctor) {
    console.log('Doctor found:', doctor._id, 'Clinic ID:', doctor.clinicId?._id);
    console.log('Doctor clinic details:', doctor.clinicId?.name, doctor.clinicId?.city);
  } else {
    console.log('No doctors found!');
  }
  
  mongoose.disconnect();
}

check().catch(console.error);
