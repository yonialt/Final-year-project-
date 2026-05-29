const { Router } = require('express');
const { getReports, getReport, createReport, forwardToOfficer, updateStatus, rejectReport } = require('../controllers/damageReport.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// All authenticated users can view (service filters by role)
router.get('/', authenticate, getReports);
router.get('/:id', authenticate, getReport);

// Staff creates damage reports
router.post('/', authenticate, createReport);

// Department Head forwards to Resource Officer
router.patch('/:id/forward', authenticate, authorize('DEPARTMENT_HEAD', 'ADMIN'), forwardToOfficer);

// Rejection by head, dean, or officer
router.patch('/:id/reject', authenticate, authorize('DEPARTMENT_HEAD', 'ACADEMIC_DEAN', 'RESOURCE_OFFICER', 'ADMIN'), rejectReport);

// Generic status update (for admin use)
router.patch('/:id/status', authenticate, authorize('RESOURCE_OFFICER', 'ADMIN'), updateStatus);

module.exports = router;
