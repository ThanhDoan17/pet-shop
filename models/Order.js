const mongoose = require('mongoose');

// Định nghĩa cấu trúc lưu vết lịch sử thay đổi trạng thái
const orderHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Liên kết tới bảng User để lấy Tên/Vai trò hiển thị
    required: true 
  },
  roleAtTime: { type: String, required: true }, // Lưu vai trò lúc sửa: 'admin' hoặc 'staff'
  updatedAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  totalPrice: { type: Number, required: true },
  shippingAddress: {
    fullName: String,
    phone: String,
    address: String,
    city: String
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
    default: 'pending'
  },
  // Thêm mảng này để ghi nhận vết xử lý của Nhân viên / Admin
  statusHistory: [orderHistorySchema], 
  paymentMethod: { type: String, default: 'cod' },
  note: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
