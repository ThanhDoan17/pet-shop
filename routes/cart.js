const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isCustomer } = require('../middleware/auth');

// Xóa các route trùng lặp, giữ lại phiên bản có middleware isCustomer
router.get('/',           isCustomer, cartController.getCart);
router.post('/add',       isCustomer, cartController.addToCart);
router.post('/update',    isCustomer, cartController.updateCart);
router.post('/remove',    isCustomer, cartController.removeFromCart);

// THÊM MỚI: Mua ngay — thêm vào cart rồi redirect thẳng checkout
router.post('/buy-now',   isCustomer, cartController.buyNow);

module.exports = router;