const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['order_delivered', 'new_message', 'reply_review'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);