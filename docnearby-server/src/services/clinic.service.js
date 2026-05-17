import { Clinic } from '../models/Clinic.js';

export const findById = async (id) => {
  return await Clinic.findById(id);
};

export const findNearby = async (lng, lat, radius) => {
  return await Clinic.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radius,
      },
    },
  });
};

export const searchByName = async (nameRegex) => {
  return await Clinic.find({ name: nameRegex });
};
