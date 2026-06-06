const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { isLoggedIn } = require('../middleware/auth'); // Import bộ lọc bảo mật của bạn

router.use(isLoggedIn);

router.get('/', messageController.getConversations);

router.get('/:partnerId', messageController.getChat);

router.post('/:partnerId/send', messageController.sendMessage);

module.exports = router;
