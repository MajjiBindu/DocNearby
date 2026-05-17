import { User } from '../models/User.js';
import { Doctor } from '../models/Doctor.js';
import AppError from '../utils/AppError.js';

export const findByEmail = async (email, selectPassword = false) => {
  let query = User.findOne({ email });
  if (selectPassword) query = query.select('+password');
  return await query;
};

export const findById = async (id) => {
  return await User.findById(id);
};

export const createUser = async (userData) => {
  const user = await User.create(userData);
  if (user.role === 'doctor') {
    await Doctor.create({ userId: user._id });
  }
  return user;
};

export const updateRole = async (userId, newRole) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  
  user.role = newRole;
  await user.save();
  
  if (newRole === 'doctor') {
    const existingDoc = await Doctor.findOne({ userId });
    if (!existingDoc) await Doctor.create({ userId });
  }
  
  return user;
};

export const deactivate = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  user.isActive = false;
  await user.save();
  return user;
};
