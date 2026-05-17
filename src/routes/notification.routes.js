const { Router } = require('express');
const { getNotifications, markAsRead, markAllRead } = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

router.get('/', authenticate, getNotifications);
router.patch('/read-all', authenticate, markAllRead);
router.patch('/:id/read', authenticate, markAsRead);

module.exports = router;
