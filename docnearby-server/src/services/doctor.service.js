import axios from 'axios';
import mongoose from "mongoose";
import { Doctor } from '../models/Doctor.js';
import { Clinic } from '../models/Clinic.js';
import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import AppError from '../utils/AppError.js';
import { SPECIALTIES } from '../config/constants.js';

export const geocodeAddress = async (address) => {
  if (!address) return null;
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { format: "json", q: address, limit: 1 },
      headers: { "User-Agent": "DocNearby/1.0" },
    });
    if (res.data && res.data[0]) {
      const { lat, lon } = res.data[0];
      return { type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)] };
    }
  } catch (error) {
    console.error(`Geocoding failed: ${error.message}`);
  }
  return null;
};

export const searchDoctors = async (params) => {
  const { specialty, language, maxFee, lat, lng, radius = 5000 } = params;
  
  const filterObj = {};
  if (specialty) filterObj.specialty = specialty;
  if (language) filterObj.languages = language;
  if (maxFee) filterObj.consultationFee = { $lte: Number(maxFee) };

  if (!lat || !lng) {
    return await Doctor.find(filterObj)
      .populate("clinicId", "name address city")
      .populate("userId", "name phone")
      .select("specialty consultationFee experience rating reviewCount isVerified")
      .sort({ rating: -1 })
      .limit(20);
  }

  const clinics = await Clinic.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    },
  }).select("_id");
  const clinicIds = clinics.map((c) => c._id);

  const clinicDoctors = await Doctor.find({
    ...filterObj,
    clinicId: { $in: clinicIds },
  })
    .populate("userId", "name email role")
    .populate("clinicId", "name address city state pincode location phone")
    .limit(50);

  const slotDoctors = await Doctor.find({
    ...filterObj,
    "availableSlots.coordinates": {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    },
  })
    .populate("userId", "name email role")
    .populate("clinicId", "name address city state pincode location phone")
    .limit(50);

  const allResults = [...clinicDoctors, ...slotDoctors];
  const seenIds = new Set();
  return allResults.filter((d) => {
    if (seenIds.has(String(d._id))) return false;
    seenIds.add(String(d._id));
    return true;
  });
};

export const findById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid doctor ID format");
  }

  const doctor = await Doctor.findById(id)
    .populate("userId", "name email role")
    .populate("clinicId", "name address city state pincode location phone");
  if (!doctor) throw new AppError('Doctor not found', 404);
  return doctor;
};

export const findByUserId = async (userId) => {
  const doctor = await Doctor.findOne({ userId })
    .populate("userId", "name email role")
    .populate("clinicId", "name address city state pincode location phone");
  if (!doctor) throw new AppError('Doctor profile not found', 404);
  return doctor;
};

export const update = async (id, data, user) => {
  const doctor = await Doctor.findById(id);
  if (!doctor) throw new AppError('Doctor not found', 404);

  if (user.role !== 'admin' && String(doctor.userId) !== String(user.userId)) {
    throw new AppError('Forbidden', 403);
  }

  const allowed = ["specialty", "qualifications", "languages", "consultationFee", "experience", "clinicId", "availableSlots"];
  allowed.forEach(k => {
    if (data[k] !== undefined) doctor[k] = data[k];
  });

  if (data.availableSlots) {
    const slotsToGeocode = doctor.availableSlots.filter(
      (s) => s.location && (!s.coordinates || !s.coordinates.coordinates),
    );
    if (slotsToGeocode.length > 0) {
      await Promise.all(slotsToGeocode.map(async (s) => {
        const coords = await geocodeAddress(s.location);
        if (coords) s.coordinates = coords;
      }));
    }

    // strip any slot that still has incomplete coordinates
    doctor.availableSlots.forEach((s) => {
      if (s.coordinates && !s.coordinates.coordinates?.length) {
        s.coordinates = undefined;
      }
    });
  }

  await doctor.save();
  return await findById(id);
};

export const globalSearch = async (params) => {
  const { q, specialty, language, sort, lat, lng, radius = 10000 } = params;
  const maxFee = params.maxFee ? Number(params.maxFee) : null;

  const filterObj = {};
  if (specialty) filterObj.specialty = specialty;
  if (language) filterObj.languages = language;
  if (maxFee) filterObj.consultationFee = { $lte: maxFee };

  if (q) {
    const regex = new RegExp(q, "i");
    const users = await User.find({ name: regex, role: "doctor" }).select("_id");
    const clinics = await Clinic.find({ name: regex }).select("_id");

    filterObj.$or = [
      { specialty: regex },
      { userId: { $in: users.map(u => u._id) } },
      { clinicId: { $in: clinics.map(c => c._id) } }
    ];
  }

  if (lat && lng) {
    const nearbyClinics = await Clinic.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius),
        },
      },
    }).select("_id");
    filterObj.clinicId = { $in: nearbyClinics.map(c => c._id) };
  }

  let sortObj = { rating: -1 };
  if (sort === "fee_asc") sortObj = { consultationFee: 1 };
  else if (sort === "fee_desc") sortObj = { consultationFee: -1 };
  else if (sort === "experience_desc") sortObj = { experience: -1 };

  return await Doctor.find(filterObj)
    .populate("userId", "name email role")
    .populate("clinicId", "name address city location")
    .select("specialty consultationFee experience rating reviewCount isVerified")
    .sort(sortObj)
    .limit(50);
};

export const getAutocompleteSuggestions = async (q) => {
  const query = String(q || "").trim();
  if (!query) return [];

  const regex = new RegExp(`^${query}`, "i");
  const suggestions = [];

  // Specialties
  suggestions.push(...SPECIALTIES.filter(s => regex.test(s)).map(s => ({ type: "specialty", text: s })));

  // Clinics
  const clinics = await Clinic.find({ name: regex }).limit(5).select("name city");
  suggestions.push(...clinics.map(c => ({ type: "clinic", text: c.name, subtext: c.city })));

  // Doctors
  const users = await User.find({ name: regex, role: "doctor" }).limit(5).select("name");
  const doctors = await Doctor.find({ userId: { $in: users.map(u => u._id) } }).populate("userId", "name").select("specialty");
  suggestions.push(...doctors.map(d => ({ type: "doctor", text: d.userId.name, subtext: d.specialty })));

  return suggestions.slice(0, 15);
};
