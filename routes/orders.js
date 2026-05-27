const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isCustomer, isLoggedIn } = require('../middleware/auth');

router.get('/checkout',    isCustomer, orderController.getCheckout);
router.post('/checkout',   isCustomer, orderController.postCheckout);
router.get('/success/:id', isCustomer, orderController.getSuccess);
router.get('/my-orders',   isLoggedIn, orderController.getMyOrders);

module.exports = router;