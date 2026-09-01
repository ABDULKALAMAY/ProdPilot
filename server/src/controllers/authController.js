import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function createToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required. Add it to server/.env.');
  return jwt.sign({ id: user._id.toString(), email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function sendAuthResponse(res, user, statusCode) {
  return res.status(statusCode).json({
    token: createToken(user),
    user: { id: user._id, name: user.name, email: user.email }
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return res.status(409).json({ message: 'An account with this email already exists. Please sign in instead.' });
    const user = await User.create({ name, email: normalizedEmail, password });
    return sendAuthResponse(res, user, 201);
  } catch (error) { return next(error); }
}

export async function login(req, res, next) {
  try {
    const email = req.body.email.toLowerCase().trim();
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).json({ message: 'Email or password is incorrect.' });
    }
    return sendAuthResponse(res, user, 200);
  } catch (error) { return next(error); }
}
