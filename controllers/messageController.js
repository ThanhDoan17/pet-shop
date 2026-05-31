const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Thuật toán băm tạo mã hội thoại nhất quán giữa 2 tài khoản
function getConversationId(id1, id2) {
  return [id1.toString(), id2.toString()].sort().join('_');
}

// 1. Trang danh sách cuộc trò chuyện (Đã tối ưu bằng Aggregation Engine)
exports.getConversations = async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/auth/login');
    const userId = req.session.user.id;
    const role = req.session.user.role;

    let conversations = [];

    if (role === 'user') {
      // KHÁCH HÀNG: Lấy danh sách nhân viên và quản trị viên
      const staffList = await User.find({ role: { $in: ['admin', 'staff'] } });
      for (const staff of staffList) {
        const convId = getConversationId(userId, staff._id);
        const lastMsg = await Message.findOne({ conversationId: convId }).sort({ createdAt: -1 });
        const unread = await Message.countDocuments({ conversationId: convId, receiverId: userId, isRead: false });
        
        if (lastMsg) {
          conversations.push({ partner: staff, lastMsg, unread, convId });
        }
      }
      
      // Nếu chưa từng nhắn tin với ai, tự động hiển thị danh sách để khách hàng chủ động click chat
      if (conversations.length === 0) {
        for (const staff of staffList) {
          const convId = getConversationId(userId, staff._id);
          conversations.push({ partner: staff, lastMsg: null, unread: 0, convId });
        }
      }
    } else {
      // ADMIN / STAFF: Tìm kiếm nâng cao bằng Aggregation tinh gọn dữ liệu
      // Chỉ lọc ra các hội thoại chứa ID của tài khoản nhân viên/admin đang đăng nhập
      const aggregatedConversations = await Message.aggregate([
        { $match: { conversationId: { $regex: userId } } }, 
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$conversationId",
            lastMsg: { $first: "$$ROOT" } // Giữ lại tài liệu tin nhắn mới nhất trong nhóm
          }
        },
        { $sort: { "lastMsg.createdAt": -1 } } // Sắp xếp hội thoại có tin nhắn mới lên đầu
      ]);

      for (const item of aggregatedConversations) {
        const convId = item._id;
        const ids = convId.split('_');
        const partnerId = ids.find(id => id !== userId);
        if (!partnerId) continue;

        const partner = await User.findById(partnerId);
        // Chỉ hiển thị hội thoại nếu đối tác là khách hàng (role === 'user')
        if (!partner || partner.role !== 'user') continue;

        const unread = await Message.countDocuments({ conversationId: convId, receiverId: userId, isRead: false });
        conversations.push({ partner, lastMsg: item.lastMsg, unread, convId });
      }
    }

    res.render('messages', { title: 'Tin nhan', conversations, currentUser: req.session.user });
  } catch (err) {
    console.error('Lỗi lấy danh sách hội thoại:', err);
    res.redirect('/');
  }
};

// 2. Trang hiển thị chi tiết khung chat với 1 người
exports.getChat = async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/auth/login');
    const userId = req.session.user.id;
    const partnerId = req.params.partnerId;

    const partner = await User.findById(partnerId);
    if (!partner) return res.redirect('/messages');

    const convId = getConversationId(userId, partnerId);
    
    // Tải toàn bộ nội dung tin nhắn của cặp hội thoại này
    const messages = await Message.find({ conversationId: convId }).sort({ createdAt: 1 });

    // Cập nhật trạng thái "Đã đọc" (isRead = true) cho các tin nhắn do đối phương gửi đến
    await Message.updateMany(
      { conversationId: convId, receiverId: userId, isRead: false },
      { isRead: true }
    );

    res.render('chat', { title: `Chat voi ${partner.name}`, partner, messages, convId, currentUser: req.session.user });
  } catch (err) {
    console.error('Lỗi hiển thị khung chat:', err);
    res.redirect('/messages');
  }
};

// 3. Gửi tin nhắn mới (Đồng bộ tạo thông báo Notification)
exports.sendMessage = async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/auth/login');
    const userId = req.session.user.id;
    const partnerId = req.params.partnerId;
    const { content } = req.body;

    if (!content || !content.trim()) return res.redirect(`/messages/${partnerId}`);

    const convId = getConversationId(userId, partnerId);

    // Lưu thực thể tin nhắn mới vào MongoDB
    await Message.create({
      conversationId: convId,
      senderId: userId,
      senderName: req.session.user.name,
      senderRole: req.session.user.role,
      receiverId: partnerId,
      content: content.trim()
    });

    // Tạo thông báo cho đối phương để đẩy số Badge trên Navbar
    await Notification.create({
      userId: partnerId,
      type: 'new_message',
      title: `Tin nhắn mới từ ${req.session.user.name}`,
      message: content.trim().substring(0, 100),
      link: `/messages/${userId}`
    });

    res.redirect(`/messages/${partnerId}`);
  } catch (err) {
    console.error('Lỗi gửi tin nhắn:', err);
    res.redirect('/messages');
  }
};
