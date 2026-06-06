const Notification = require('../models/Notification');
const Order = require('../models/Order');
const Review = require('../models/Review');

// ==========================================
// CHỨC NĂNG MỚI: NHÂN VIÊN/ADMIN CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG KÈM GHI VẾT
// ==========================================
exports.updateOrderStatusByStaff = async (req, res) => {
  try {
    // Kiểm tra quyền an toàn bảo mật tuyến luồng
    if (!req.session.user || !['admin', 'staff'].includes(req.session.user.role)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này.' });
    }

    const { orderId } = req.params;
    const { status } = req.body; // Giá trị mong đợi: 'confirmed', 'shipping', 'delivered', 'cancelled'
    
    // Trích xuất thông tin định danh từ Session quản lý phiên
    const staffId = req.session.user.id;
    const staffRole = req.session.user.role; // 'staff' hoặc 'admin'

    // 1. Truy vấn tài liệu Đơn hàng từ Database
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng.' });
    }

    // 2. Chuyển đổi trạng thái hiện tại
    order.status = status;

    // 3. Đẩy thông tin Log vào mảng Lịch sử vết (Audit Trail)
    order.statusHistory.push({
      status: status,
      updatedBy: staffId,
      roleAtTime: staffRole,
      updatedAt: new Date()
    });

    // 4. Lưu trạng thái xuống cơ sở dữ liệu MongoDB
    await order.save();

    // 5. Nếu trạng thái chuyển sang "delivered", kích hoạt hàm sinh thông báo tự động của bạn
    if (status === 'delivered') {
      const orderCode = order.orderCode || order._id.toString().slice(-6).toUpperCase(); 
      await exports.createDeliveredNotification(order.user, order._id, orderCode);
    }

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái đơn hàng sang: ${status} thành công.`,
      data: order
    });

  } catch (err) {
    console.error('Lỗi cập nhật trạng thái hệ thống:', err);
    return res.status(500).json({ success: false, message: 'Có lỗi xảy ra trong quá trình cập nhật đơn hàng.' });
  }
};

// Lấy danh sách thông báo và Render giao diện EJS
exports.getNotifications = async (req, res) => {
  try {
    if (!req.session.user) return res.redirect('/auth/login');
    const notifications = await Notification.find({ userId: req.session.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    await Notification.updateMany(
      { userId: req.session.user.id, isRead: false },
      { isRead: true }
    );
    res.render('notifications', { title: 'Thong bao', notifications });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

// Đếm thông báo chưa đọc (API phục vụ Badge trên Navbar)
exports.getUnreadCount = async (req, res) => {
  try {
    if (!req.session.user) return res.json({ count: 0 });
    const count = await Notification.countDocuments({
      userId: req.session.user.id,
      isRead: false
    });
    res.json({ count });
  } catch (err) {
    res.json({ count: 0 });
  }
};

// Tạo thông báo khi đơn hàng delivered cho từng sản phẩm
exports.createDeliveredNotification = async (userId, orderId, orderCode) => {
  try {
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) return;

    for (const item of order.items) {
      await Notification.create({
        userId,
        type: 'order_delivered',
        title: 'Đơn hàng đã giao thành công!',
        message: `Đơn hàng #${orderCode} đã được giao. Hãy đánh giá sản phẩm "${item.name}" của bạn nhé!`,
        link: item.product ? `/products/${item.product._id}` : '/orders/my-orders',
        orderId,
        productId: item.product ? item.product._id : null
      });
    }
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// Tạo thông báo khi admin reply review
exports.createReplyNotification = async (userId, productName, productId) => {
  try {
    await Notification.create({
      userId,
      type: 'reply_review',
      title: 'Cửa hàng đã phản hồi đánh giá của bạn!',
      message: `PESTshop đã phản hồi đánh giá của bạn về sản phẩm "${productName}".`,
      link: `/products/${productId}`,
      productId
    });
  } catch (err) {
    console.error('Error creating reply notification:', err);
  }
}; // <--- ĐÃ SỬA: Đóng ngoặc nhọn chuẩn xác cho hàm createReplyNotification tại đây

// ==========================================
// CHỨC NĂNG KHÁCH HÀNG TỰ HỦY ĐƠN HÀNG KHI CHỜ XỬ LÝ (PENDING)
// ==========================================
exports.customerCancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const customerId = req.session.user.id; 

    // Tìm kiếm đơn hàng khớp mã và đúng của khách hàng hiện tại
    const order = await Order.findOne({ _id: orderId, user: customerId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn." });
    }

    // Ràng buộc nghiệp vụ trạng thái
    if (order.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        message: "Không thể hủy đơn hàng! Đơn hàng đã được xử lý hoặc vận chuyển." 
      });
    }

    // Đổi trạng thái sang hủy đơn
    order.status = 'cancelled';
    order.statusHistory.push({
      status: 'cancelled',
      updatedBy: customerId,
      roleAtTime: 'user', 
      updatedAt: new Date()
    });

    await order.save();
    return res.status(200).json({ success: true, message: "Bạn đã hủy đơn hàng thành công." });

  } catch (err) {
    console.error("Lỗi khi khách hàng hủy đơn:", err);
    return res.status(500).json({ success: false, message: "Có lỗi xảy ra trong quá trình hủy đơn." });
  }
};
