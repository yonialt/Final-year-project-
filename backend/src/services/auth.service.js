const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken } = require('../config/jwt');

const SALT_ROUNDS = 10;

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string, role?: string }} data
 */
const register = async ({ name, email, password, role }) => {
  // Check for existing account
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email is already in use');
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      ...(role && { role }),
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const token = signToken({ id: user.id, role: user.role });
  return { user, token };
};

/**
 * Login with email and password.
 * @param {{ email: string, password: string }} credentials
 */
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const { password: _pw, ...safeUser } = user;
  const token = signToken({ id: safeUser.id, role: safeUser.role });
  return { user: safeUser, token };
};

/**
 * Fetch the current authenticated user by id.
 * @param {string} userId
 */
const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
};

module.exports = { register, login, getMe };
