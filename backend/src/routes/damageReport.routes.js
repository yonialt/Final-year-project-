const { Router } = require('express');
const { getReports, getReport, createReport, forwardToOfficer, updateStatus } = require('../controllers/damageReport.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// All authenticated users can view (service filters by role)
router.get('/', authenticate, getReports);
router.get('/:id', authenticate, getReport);

// Staff creates damage reports
router.post('/', authenticate, createReport);

// Department Head forwards to Resource Officer
router.patch('/:id/forward', authenticate, authorize('DEPARTMENT_HEAD', 'ADMIN'), forwardToOfficer);

// Generic status update (for admin use)
router.patch('/:id/status', authenticate, authorize('RESOURCE_OFFICER', 'ADMIN'), updateStatus);

module.exports = router;
