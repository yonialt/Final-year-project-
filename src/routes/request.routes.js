const { Router } = require('express');
const { getRequests, createRequest, updateStatus } = require('../controllers/request.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', authenticate, getRequests);
router.post('/', authenticate, createRequest);
router.patch('/:id/status', authenticate, updateStatus);

module.exports = router;
