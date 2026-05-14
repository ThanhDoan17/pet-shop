const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin', 'staff'], default: 'user' }
  }, { timestamps: true });
  cart: [{
  productId: { type: String },
  name: { type: String },
  price: { type: Number },
  image: { type: String },
  quantity: { type: Number, default: 1 }
  }]

module.exports = mongoose.model('User', userSchema);