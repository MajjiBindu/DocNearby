import dotenv from 'dotenv'
dotenv.config()

import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { connectDb } from '../src/config/db.js'
import { User } from '../src/models/User.js'
import { Doctor } from '../src/models/Doctor.js'
import { Clinic } from '../src/models/Clinic.js'
import { Appointment } from '../src/models/Appointment.js'
import { Lab } from '../src/models/Lab.js'

function randPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function addDays(d, days) {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

async function main() {
  await connectDb()

  await Promise.all([
    Appointment.deleteMany({}),
    Doctor.deleteMany({}),
    Clinic.deleteMany({}),
    User.deleteMany({}),
    Lab.deleteMany({}),
  ])

  const clinics = await Clinic.insertMany([
    {
      name: 'Sai Family Clinic',
      address: 'Near Bus Stand, Main Road',
      city: 'Warangal',
      state: 'Telangana',
      pincode: '506001',
      phone: '9876543210',
      location: { type: 'Point', coordinates: [79.5941, 17.9784] },
    },
    {
      name: 'Namma Care Clinic',
      address: '2nd Cross, Market Area',
      city: 'Hubballi',
      state: 'Karnataka',
      pincode: '580020',
      phone: '9876501234',
      location: { type: 'Point', coordinates: [75.124, 15.3647] },
    },
    {
      name: 'Shree Health Centre',
      address: 'Old City, Near Temple',
      city: 'Ujjain',
      state: 'Madhya Pradesh',
      pincode: '456001',
      phone: '9876512345',
      location: { type: 'Point', coordinates: [75.7849, 23.1765] },
    },
  ])

  const labs = await Lab.insertMany([
    {
      name: 'SRL Diagnostics - Warangal',
      address: 'Station Road, Near Clock Tower',
      city: 'Warangal',
      pincode: '506002',
      phone: '9888800001',
      location: { type: 'Point', coordinates: [79.602, 17.983] },
      openTime: '07:00',
      closeTime: '20:00',
      rating: 4.4,
      tests: [
        { name: 'CBC', price: 350, homeCollection: true },
        { name: 'HbA1c', price: 600, homeCollection: true },
        { name: 'Lipid Profile', price: 900, homeCollection: false },
      ],
    },
    {
      name: 'Thyrocare - Hubballi',
      address: 'Gokul Road, Opp. Park',
      city: 'Hubballi',
      pincode: '580030',
      phone: '9888800002',
      location: { type: 'Point', coordinates: [75.135, 15.37] },
      openTime: '07:00',
      closeTime: '19:30',
      rating: 4.2,
      tests: [
        { name: 'Thyroid Profile', price: 450, homeCollection: true },
        { name: 'Vitamin D', price: 1200, homeCollection: true },
        { name: 'CBC', price: 300, homeCollection: false },
      ],
    },
    {
      name: 'Metropolis Lab - Ujjain',
      address: 'Freeganj, Near Main Square',
      city: 'Ujjain',
      pincode: '456010',
      phone: '9888800003',
      location: { type: 'Point', coordinates: [75.79, 23.18] },
      openTime: '06:30',
      closeTime: '20:30',
      rating: 4.5,
      tests: [
        { name: 'Lipid Profile', price: 850, homeCollection: true },
        { name: 'CBC', price: 320, homeCollection: true },
        { name: 'LFT', price: 700, homeCollection: false },
      ],
    },
    {
      name: 'Arogya Pathology - Warangal',
      address: 'Hanamkonda, Near Market',
      city: 'Warangal',
      pincode: '506009',
      phone: '9888800004',
      location: { type: 'Point', coordinates: [79.58, 17.99] },
      openTime: '07:30',
      closeTime: '20:00',
      rating: 4.1,
      tests: [
        { name: 'KFT', price: 650, homeCollection: false },
        { name: 'HbA1c', price: 550, homeCollection: true },
        { name: 'ESR', price: 200, homeCollection: false },
      ],
    },
    {
      name: 'CityCare Diagnostics - Hubballi',
      address: 'Koppikar Road, Near Circle',
      city: 'Hubballi',
      pincode: '580020',
      phone: '9888800005',
      location: { type: 'Point', coordinates: [75.12, 15.365] },
      openTime: '07:00',
      closeTime: '20:00',
      rating: 4.0,
      tests: [
        { name: 'CBC', price: 280, homeCollection: true },
        { name: 'CRP', price: 500, homeCollection: false },
        { name: 'Lipid Profile', price: 820, homeCollection: true },
      ],
    },
  ])

  const seededPassword = await bcrypt.hash('Password@123', 12)
  const doctorUsers = await User.insertMany([
    { email: 'ananya.rao@docnearby.local', password: seededPassword, name: 'Dr. Ananya Rao', role: 'doctor', isEmailVerified: true, emailVerifiedAt: new Date() },
    { email: 'mohan.kumar@docnearby.local', password: seededPassword, name: 'Dr. Mohan Kumar', role: 'doctor', isEmailVerified: true, emailVerifiedAt: new Date() },
    { email: 'priya.sharma@docnearby.local', password: seededPassword, name: 'Dr. Priya Sharma', role: 'doctor', isEmailVerified: true, emailVerifiedAt: new Date() },
    { email: 'farhan.ali@docnearby.local', password: seededPassword, name: 'Dr. Farhan Ali', role: 'doctor', isEmailVerified: true, emailVerifiedAt: new Date() },
    { email: 's.iyer@docnearby.local', password: seededPassword, name: 'Dr. S. Iyer', role: 'doctor', isEmailVerified: true, emailVerifiedAt: new Date() },
  ])

  const specialties = [
    'General Physician',
    'Dermatologist',
    'Pediatrician',
    'Gynecologist',
    'ENT Specialist',
    'Orthopedic',
    'Dentist',
  ]
  const languages = ['Hindi', 'English', 'Telugu', 'Tamil', 'Kannada', 'Marathi']
  const slotCoordinatesByDoctor = [
    [80.4365, 16.3067],
    [80.648, 16.5062],
    [79.9865, 14.4426],
    [79.4192, 13.6288],
    [78.0373, 15.8281],
  ]

  const doctors = []
  for (let i = 0; i < doctorUsers.length; i++) {
    const clinic = randPick(clinics)
    const slotCoordinates = slotCoordinatesByDoctor[i % slotCoordinatesByDoctor.length]
    doctors.push({
      userId: doctorUsers[i]._id,
      specialty: randPick(specialties),
      qualifications: ['MBBS', randPick(['MD', 'MS', 'DNB'])],
      languages: [randPick(languages), 'English'],
      consultationFee: randPick([300, 400, 500, 600]),
      experience: randPick([3, 5, 7, 10, 12]),
      clinicId: clinic._id,
      availableSlots: [
        { day: 'Mon', startTime: '09:00', endTime: '13:00', slotDuration: 20, coordinates: { type: 'Point', coordinates: slotCoordinates } },
        { day: 'Wed', startTime: '16:00', endTime: '19:00', slotDuration: 20, coordinates: { type: 'Point', coordinates: slotCoordinates } },
        { day: 'Sat', startTime: '10:00', endTime: '14:00', slotDuration: 20, coordinates: { type: 'Point', coordinates: slotCoordinates } },
      ],
      isVerified: true,
      rating: randPick([4.1, 4.3, 4.5, 4.7]),
      reviewCount: randPick([12, 24, 35, 48]),
    })
  }

  const createdDoctors = await Doctor.insertMany(doctors)

  // back-fill clinic.doctors arrays
  const clinicToDoctors = new Map(clinics.map((c) => [String(c._id), []]))
  for (const d of createdDoctors) {
    clinicToDoctors.get(String(d.clinicId))?.push(d._id)
  }
  for (const c of clinics) {
    c.doctors = clinicToDoctors.get(String(c._id)) || []
    await c.save()
  }

  const patientUsers = await User.insertMany([
    { email: 'suresh@docnearby.local', password: seededPassword, name: 'Suresh', role: 'patient', isEmailVerified: true, emailVerifiedAt: new Date() },
    { email: 'asha@docnearby.local', password: seededPassword, name: 'Asha', role: 'patient', isEmailVerified: true, emailVerifiedAt: new Date() },
    { email: 'ravi@docnearby.local', password: seededPassword, name: 'Ravi', role: 'patient', isEmailVerified: true, emailVerifiedAt: new Date() },
  ])

  const statuses = ['pending', 'confirmed', 'completed', 'cancelled']
  const slots = ['10:00 AM', '10:20 AM', '10:40 AM', '11:00 AM', '11:20 AM']

  const appts = []
  const base = new Date()
  for (let i = 0; i < 10; i++) {
    const d = randPick(createdDoctors)
    appts.push({
      patientId: randPick(patientUsers)._id,
      doctorId: d._id,
      clinicId: d.clinicId,
      date: addDays(base, randPick([-3, -1, 0, 1, 2, 5, 7])),
      slot: randPick(slots),
      status: randPick(statuses),
    })
  }
  const createdAppointments = await Appointment.insertMany(appts)

  // eslint-disable-next-line no-console
  console.log('Seed complete:', {
    clinics: clinics.length,
    labs: labs.length,
    doctors: createdDoctors.length,
    patients: patientUsers.length,
    appointments: createdAppointments.length,
  })

  await mongoose.disconnect()
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed', err)
  process.exit(1)
})
