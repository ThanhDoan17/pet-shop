const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductDetail);

router.post('/:id/review', productController.createProductReview);
router.post('/:productId/review/:reviewId/reply', productController.replyReview);
router.post('/:productId/review/:reviewId/delete-reply', productController.deleteReply);

module.exports = router;
