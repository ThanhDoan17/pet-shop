const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { isLoggedIn } = require('../middleware/auth'); // Import bộ lọc bảo mật của bạn

// Chặn toàn bộ các hành vi truy cập trái phép nếu chưa đăng nhập session
router.use(isLoggedIn);

// Xem danh sách các cuộc trò chuyện (Khách thấy Staff - Staff thấy danh sách Khách)
router.get('/', messageController.getConversations);

// Xem chi tiết nội dung cuộc hội thoại giữa 2 người cụ thể
router.get('/:partnerId', messageController.getChat);

// Thực hiện hành vi gửi tin nhắn mới và kích hoạt hệ thống sinh thông báo badge
router.post('/:partnerId/send', messageController.sendMessage);

module.exports = router;
