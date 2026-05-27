const Notification = require('../models/Notification');
const Order = require('../models/Order');
const Review = require('../models/Review');

// Lấy danh sách thông báo
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

// Đếm thông báo chưa đọc (API)
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

// Tạo thông báo khi đơn hàng delivered
exports.createDeliveredNotification = async (userId, orderId, orderCode) => {
  try {
    // Lấy các sản phẩm trong đơn hàng
    const order = await Order.findById(orderId).populate('items.product');
    if (!order) return;

    // Tạo thông báo cho từng sản phẩm trong đơn
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
};