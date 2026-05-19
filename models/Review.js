const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, enum: ['user', 'staff', 'admin'], default: 'user' },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  comment: { type: String, required: true },
  reply: { type: String, default: '' },
  replyAt: { type: Date, default: null },
  replyBy: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);