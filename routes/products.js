const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductDetail);

// SỬA TẠI ĐÂY: Bỏ chữ /products ở đầu đi để khớp chính xác với form gửi dữ liệu
router.post('/:id/review', productController.createProductReview);

module.exports = router;
