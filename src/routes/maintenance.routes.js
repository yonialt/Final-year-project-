const { Router } = require('express');
const { getAllMaintenance, getMaintenanceById, assignTechnician, submitInspection, finalize, completeRepair } = require('../controllers/maintenance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

// Anyone authenticated can see maintenance tasks (service filters by role)
router.get('/', authenticate, getAllMaintenance);
router.get('/:id', authenticate, getMaintenanceById);

// Resource Officer assigns technician to damage report
router.post('/assign', authenticate, authorize('RESOURCE_OFFICER', 'ADMIN'), assignTechnician);

// Technician submits inspection data → triggers AI
router.patch('/:id/inspect', authenticate, authorize('TECHNICIAN', 'ADMIN'), submitInspection);

// Resource Officer finalizes decision (REPAIR or REPLACE)
router.patch('/:id/finalize', authenticate, authorize('RESOURCE_OFFICER', 'ADMIN'), finalize);

// Technician submits repair completion
router.patch('/:id/complete-repair', authenticate, authorize('TECHNICIAN', 'ADMIN'), completeRepair);

module.exports = router;
