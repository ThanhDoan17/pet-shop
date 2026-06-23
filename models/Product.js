const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true, min: 0 },
  
  image: { type: String, default: '/images/default.jpg' },
  
  images: [{ 
    type: String, 
    default: [] 
  }],

  category: { 
    type: String, 
    enum: ['tank', 'food', 'accessory', 'reptile', 'hamster', 'medicine', 'clothing', 'fish'], 
    required: true 
  },
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);