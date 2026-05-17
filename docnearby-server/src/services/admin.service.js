import { Doctor } from '../models/Doctor.js';
import { Appointment } from '../models/Appointment.js';
import { User } from '../models/User.js';
import { Review } from '../models/Review.js';
import mongoose from 'mongoose';

export const getStats = async () => {
  const [
    totalDoctors,
    verifiedDoctors,
    totalAppointments,
    totalPatients,
    totalUsers
  ] = await Promise.all([
    Doctor.countDocuments(),
    Doctor.countDocuments({ isVerified: true }),
    Appointment.countDocuments(),
    User.countDocuments({ role: 'patient' }),
    User.countDocuments()
  ]);

  const appointmentsByStatus = await Appointment.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  return { 
    totalDoctors, 
    verifiedDoctors,
    totalAppointments, 
    totalPatients,
    totalUsers,
    appointmentsByStatus: appointmentsByStatus.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {})
  };
};

export const verifyDoctor = async (id) => {
  return await Doctor.findByIdAndUpdate(
    id, 
    { isVerified: true, rejectedAt: null, rejectionReason: null }, 
    { new: true }
  ).populate('userId', 'name email');
};

export const rejectDoctor = async (id, reason) => {
  return await Doctor.findByIdAndUpdate(
    id,
    { isVerified: false, rejectedAt: new Date(), rejectionReason: reason },
    { new: true }
  ).populate('userId', 'name email');
};

export const listAllAppointments = async (query = {}, options = {}) => {
  const { page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        populate: [{ path: 'userId', select: 'name email role' }],
        select: 'specialty'
      })
      .populate('clinicId', 'name city')
      .select('patientId doctorId clinicId date slot status createdAt')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit)),
    Appointment.countDocuments(query)
  ]);

  return { appointments, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};
