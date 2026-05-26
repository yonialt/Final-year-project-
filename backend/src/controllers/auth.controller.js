const authService = require('../services/auth.service');

/**
 * POST /auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await authService.register({ name, email, password, role });

    res.status(201).json({
      message: 'Registration successful',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.json({
      message: 'Login successful',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /auth/me  (protected)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);

    res.json({
      message: 'Profile retrieved',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /auth/change-password  (protected)
 */
const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.user.id, req.body);
    res.json({ message: result.message });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, changePassword };
