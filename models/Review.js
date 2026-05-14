const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['user', 'staff', 'admin'],
    default: 'user'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0 // Bằng 0 nếu chỉ trao đổi/hỏi đáp, từ 1 đến 5 nếu là chấm điểm sao
  },
  comment: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
