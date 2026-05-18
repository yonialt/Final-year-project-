const { Router } = require('express');
const { getRequests, getRequest, createRequest, updateStatus } = require('../controllers/request.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', authenticate, getRequests);
router.get('/:id', authenticate, getRequest);
router.post('/', authenticate, createRequest);
router.patch('/:id/status', authenticate, updateStatus);

module.exports = router;
