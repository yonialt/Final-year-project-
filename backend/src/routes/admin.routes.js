const { Router } = require('express');
const { createUser, getUsers, getUser, updateUser, deleteUser, getAnalytics, getSystemStats, bulkCreateUsers } = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, adminCreateUserRules } = require('../middleware/validate.middleware');


const router = Router();

// Analytics — accessible to management roles
router.get('/analytics', authenticate, authorize('ADMIN', 'ACADEMIC_DEAN', 'RESOURCE_OFFICER'), getAnalytics);

// System-wide stats — ADMIN only (for the admin dashboard)
router.get('/system-stats', authenticate, authorize('ADMIN'), getSystemStats);


// User management — ADMIN and DEPARTMENT_HEAD (management), RESOURCE_OFFICER (read-only)
router.post('/users/bulk', authenticate, authorize('ADMIN', 'DEPARTMENT_HEAD'), bulkCreateUsers);
router.post('/users', authenticate, authorize('ADMIN', 'DEPARTMENT_HEAD'), adminCreateUserRules, validate, createUser);
router.get('/users', authenticate, authorize('ADMIN', 'RESOURCE_OFFICER', 'DEPARTMENT_HEAD'), getUsers);
router.get('/users/:id', authenticate, authorize('ADMIN', 'RESOURCE_OFFICER', 'DEPARTMENT_HEAD'), getUser);
router.patch('/users/:id', authenticate, authorize('ADMIN', 'DEPARTMENT_HEAD'), updateUser);
router.delete('/users/:id', authenticate, authorize('ADMIN', 'DEPARTMENT_HEAD'), deleteUser);

module.exports = router;
