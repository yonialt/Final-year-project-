const { Router } = require('express');
const { createUser, getUsers, getUser, updateUser, deleteUser, getAnalytics, getSystemStats } = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, adminCreateUserRules } = require('../middleware/validate.middleware');


const router = Router();

// Analytics — accessible to management roles
router.get('/analytics', authenticate, authorize('ADMIN', 'ACADEMIC_DEAN', 'RESOURCE_OFFICER'), getAnalytics);

// System-wide stats — ADMIN only (for the admin dashboard)
router.get('/system-stats', authenticate, authorize('ADMIN'), getSystemStats);


// User management — ADMIN and RESOURCE_OFFICER (read only for officer)
router.post('/users', authenticate, authorize('ADMIN'), adminCreateUserRules, validate, createUser);
router.get('/users', authenticate, authorize('ADMIN', 'RESOURCE_OFFICER'), getUsers);
router.get('/users/:id', authenticate, authorize('ADMIN', 'RESOURCE_OFFICER'), getUser);
router.patch('/users/:id', authenticate, authorize('ADMIN'), updateUser);
router.delete('/users/:id', authenticate, authorize('ADMIN'), deleteUser);

module.exports = router;
