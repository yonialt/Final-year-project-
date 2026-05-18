const { Router } = require('express');
const { getUsers, getUser, updateUser, deleteUser, getAnalytics } = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// Analytics — accessible to management roles
router.get('/analytics', authenticate, authorize('ADMIN', 'ACADEMIC_DEAN', 'RESOURCE_OFFICER'), getAnalytics);

// User management — ADMIN and RESOURCE_OFFICER (read only for officer)
router.get('/users', authenticate, authorize('ADMIN', 'RESOURCE_OFFICER'), getUsers);
router.get('/users/:id', authenticate, authorize('ADMIN', 'RESOURCE_OFFICER'), getUser);
router.patch('/users/:id', authenticate, authorize('ADMIN'), updateUser);
router.delete('/users/:id', authenticate, authorize('ADMIN'), deleteUser);

module.exports = router;
