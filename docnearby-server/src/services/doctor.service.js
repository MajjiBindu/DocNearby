import axios from 'axios';
import mongoose from "mongoose";
import { Doctor } from '../models/Doctor.js';
import { Clinic } from '../models/Clinic.js';
import { User } from '../models/User.js';
import { Appointment } from '../models/Appointment.js';
import AppError from '../utils/AppError.js';
import { SPECIALTIES } from '../config/constants.js';

export const geocodeAddress = async (address, retries = 3, delayMs = 1000) => {
  if (!address) return null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Geocoding attempt ${attempt} for address: "${address}"`);
      const res = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { format: "json", q: address, limit: 1 },
        headers: { 
          "User-Agent": "DocNearby/1.0 (bindumadhavi6281@gmail.com)",
          "Accept-Language": "en"
        },
        timeout: 5000,
      });
      if (res.data && res.data[0]) {
        const { lat, lon } = res.data[0];
        console.log(`Geocoding success for "${address}": [${lon}, ${lat}]`);
        return { type: "Point", coordinates: [parseFloat(lon), parseFloat(lat)] };
      }
      console.warn(`Geocoding attempt ${attempt} returned no results for "${address}"`);
      break; // No retry needed if OpenStreetMap returned 200 OK with no results
    } catch (error) {
      console.error(`Geocoding attempt ${attempt} failed for "${address}": ${error.message}`);
      if (attempt < retries) {
        console.log(`Waiting ${delayMs}ms before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // exponential backoff
      }
    }
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

  const allowed = ["specialty", "qualifications", "languages", "consultationFee", "experience", "clinicId", "availableSlots", "profilePhoto", "bio", "blockedDates"];
  allowed.forEach(k => {
    if (data[k] !== undefined) {
      if (k === 'blockedDates' && Array.isArray(data[k])) {
        doctor[k] = [...new Set(data[k])].filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
      } else {
        doctor[k] = data[k];
      }
    }
  });

  if (data.availableSlots) {
    const slotsToGeocode = doctor.availableSlots.filter(
      (s) => s.location && (!s.coordinates || !s.coordinates.coordinates || s.coordinates.coordinates.length === 0),
    );
    if (slotsToGeocode.length > 0) {
      // Execute geocoding sequentially with a delay to respect Nominatim limits
      for (const s of slotsToGeocode) {
        const coords = await geocodeAddress(s.location);
        if (coords) {
          s.coordinates = coords;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
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
  const { q, specialty, language, sort, lat, lng, radius = 10000, page = 1, limit = 20 } = params;
  const maxFee = params.maxFee ? Number(params.maxFee) : null;
  const skip = (Number(page) - 1) * Number(limit);

  const filterObj = {};
  if (specialty) filterObj.specialty = specialty;
  if (language) filterObj.languages = language;
  if (maxFee) filterObj.consultationFee = { $lte: maxFee };

  if (q) {
    const regex = new RegExp(q, "i");
    const [users, clinics] = await Promise.all([
      User.find({ name: regex, role: "doctor" }).select("_id"),
      Clinic.find({ name: regex }).select("_id")
    ]);

    const orClauses = [{ specialty: regex }];
    if (users.length > 0) {
      orClauses.push({ userId: { $in: users.map(u => u._id) } });
    }
    if (clinics.length > 0) {
      orClauses.push({ clinicId: { $in: clinics.map(c => c._id) } });
    }
    filterObj.$or = orClauses;
  }

  let sortObj = { rating: -1 };
  if (sort === "fee_asc") sortObj = { consultationFee: 1 };
  else if (sort === "fee_desc") sortObj = { consultationFee: -1 };
  else if (sort === "experience_desc") sortObj = { experience: -1 };

  // Fallback: If no lat/lng is provided by the client, return all matched doctors directly
  if (!lat || !lng) {
    const doctors = await Doctor.find(filterObj)
      .populate("userId", "name email role")
      .populate("clinicId", "name address city location")
      .select("specialty consultationFee experience rating reviewCount isVerified")
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));
    return doctors;
  }

  // Geospatial Search: Find nearby clinics within radius
  const nearbyClinics = await Clinic.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
        $maxDistance: Number(radius),
      },
    },
  }).select("_id");
  const nearbyClinicIds = nearbyClinics.map(c => c._id);

  // Combine into a single DB query using $or to avoid in-memory deduplication
  const geoOrClauses = [
    { clinicId: { $in: nearbyClinicIds } },
    {
      "availableSlots.coordinates": {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius),
        },
      },
    }
  ];

  const finalQuery = { ...filterObj, $or: filterObj.$or ? [{ $or: filterObj.$or }, { $or: geoOrClauses }] : geoOrClauses };

  const deduplicated = await Doctor.find(finalQuery)
    .populate("userId", "name email role")
    .populate("clinicId", "name address city location")
    .select("specialty consultationFee experience rating reviewCount isVerified")
    .sort(sortObj)
    .skip(skip)
    .limit(Number(limit));

  return deduplicated;
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
