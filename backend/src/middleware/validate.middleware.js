const { validationResult, body } = require('express-validator');

/**
 * Run after validation chains — collects errors and short-circuits with 422.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Custom Validators ────────────────────────────────────────────────────────

const isFullName = (value) => {
  const parts = value.trim().split(/\s+/);
  if (parts.length < 2) {
    throw new Error('Full name must contain both first and last name');
  }
  if (!/^[a-zA-Z.\s-]+$/.test(value)) {
    throw new Error('Full name can only contain letters, spaces, dots, and hyphens');
  }
  return true;
};

const isUniversityEmail = (value) => {
  if (!value.toLowerCase().endsWith('@uog.edu.et')) {
    throw new Error('Email must be a university email (@uog.edu.et)');
  }
  return true;
};

// ─── Validation Chains ────────────────────────────────────────────────────────

const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .custom(isFullName),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .custom(isUniversityEmail),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  body('role')
    .optional()
    .isIn(['STAFF', 'DEPARTMENT_HEAD', 'ACADEMIC_DEAN', 'RESOURCE_OFFICER', 'TECHNICIAN', 'ADMIN'])
    .withMessage('Invalid role'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];
const adminCreateUserRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .custom(isFullName),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail()
    .custom(isUniversityEmail),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('role')
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['STAFF', 'DEPARTMENT_HEAD', 'ACADEMIC_DEAN', 'RESOURCE_OFFICER', 'TECHNICIAN', 'ADMIN'])
    .withMessage('Invalid role'),

  body('department')
    .optional()
    .trim(),
];

const changePasswordRules = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number'),
];

module.exports = { validate, registerRules, loginRules, adminCreateUserRules, changePasswordRules };
