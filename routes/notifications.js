const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { isLoggedIn, isStaff } = require('../middleware/auth'); // Import bộ lọc bảo mật của bạn

router.use(isLoggedIn);

router.get('/', notificationController.getNotifications);

router.get('/unread-count', notificationController.getUnreadCount);


router.put('/order/:orderId/status', isStaff, notificationController.updateOrderStatusByStaff);

module.exports = router;
