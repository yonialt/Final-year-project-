const { Router } = require('express');
const { register, login, getMe, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const {
  validate,
  registerRules,
  loginRules,
  changePasswordRules,
} = require('../middleware/validate.middleware');

const router = Router();

/**
 * @route   POST /auth/register
 * @access  Public
 */
router.post('/register', registerRules, validate, register);

/**
 * @route   POST /auth/login
 * @access  Public
 */
router.post('/login', loginRules, validate, login);

/**
 * @route   GET /auth/me
 * @access  Private (requires Bearer JWT)
 */
router.get('/me', authenticate, getMe);

/**
 * @route   POST /auth/change-password
 * @access  Private (requires Bearer JWT)
 */
router.post('/change-password', authenticate, changePasswordRules, validate, changePassword);

module.exports = router;
