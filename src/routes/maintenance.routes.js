const { Router } = require('express');
const { getAllMaintenance, getMaintenanceById, startMaintenance, inputData, finalize } = require('../controllers/maintenance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// Anyone authenticated can see maintenance tasks (service filters by role)
router.get('/', authenticate, getAllMaintenance);
router.get('/:id', authenticate, getMaintenanceById);

// Resource Officer assigns technician
router.post('/start', authenticate, authorize('RESOURCE_OFFICER', 'ADMIN'), startMaintenance);

// Technician submits assessment
router.patch('/:id/data', authenticate, authorize('TECHNICIAN', 'ADMIN'), inputData);

// Resource Officer finalizes decision
router.patch('/:id/finalize', authenticate, authorize('RESOURCE_OFFICER', 'ADMIN'), finalize);

module.exports = router;
