const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/checkout', orderController.getCheckout);
router.post('/checkout', orderController.postCheckout);
router.get('/success/:id', orderController.getSuccess);
router.get('/my-orders', orderController.getMyOrders);

const { isCustomer, isLoggedIn } = require('../middleware/auth');

router.get('/checkout', isCustomer, orderController.getCheckout);
router.post('/checkout', isCustomer, orderController.postCheckout);
router.get('/success/:id', isCustomer, orderController.getSuccess);
router.get('/my-orders', isLoggedIn, orderController.getMyOrders);

module.exports = router;