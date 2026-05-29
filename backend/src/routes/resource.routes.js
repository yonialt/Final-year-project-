const { Router } = require('express');
const { body } = require('express-validator');
const {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
  replaceResource
} = require('../controllers/resource.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');

const router = Router();

const resourceRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').trim().notEmpty().withMessage('Type is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('purchaseDate').notEmpty().isISO8601().withMessage('Valid purchase date required'),
  body('purchasePrice').notEmpty().isFloat({ min: 0 }).withMessage('Purchase price must be ≥ 0'),
  body('userId').optional({ nullable: true }).isString().withMessage('User ID must be a string'),
];

/** GET /resources */
router.get('/', authenticate, getAllResources);

/** GET /resources/:id */
router.get('/:id', authenticate, getResourceById);

/** POST /resources  — RESOURCE_OFFICER | ADMIN */
router.post('/', authenticate, authorize('RESOURCE_OFFICER', 'ADMIN'), resourceRules, validate, createResource);

/** PUT /resources/:id  — RESOURCE_OFFICER | ADMIN */
router.put('/:id', authenticate, authorize('RESOURCE_OFFICER', 'ADMIN'), updateResource);

/** PATCH /resources/:id/replace  — RESOURCE_OFFICER | ADMIN */
router.patch('/:id/replace', authenticate, authorize('RESOURCE_OFFICER', 'ADMIN'), replaceResource);

/** DELETE /resources/:id  — RESOURCE_OFFICER | ADMIN */
router.delete('/:id', authenticate, authorize('RESOURCE_OFFICER', 'ADMIN'), deleteResource);

module.exports = router;
