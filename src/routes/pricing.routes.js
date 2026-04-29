const { Router } = require('express');
const { getPricingForType } = require('../controllers/pricing.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

/**
 * @route   GET /prices/:resourceType
 * @access  Private
 */
router.get('/:resourceType', authenticate, getPricingForType);

module.exports = router;
