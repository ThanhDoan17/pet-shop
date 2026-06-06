const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const notificationController = require('../controllers/notificationController'); 
const { isCustomer, isLoggedIn } = require('../middleware/auth');

router.get('/checkout',    isCustomer, orderController.getCheckout);
router.post('/checkout',   isCustomer, orderController.postCheckout);
router.get('/success/:id', isCustomer, orderController.getSuccess);
router.get('/my-orders', isCustomer, orderController.getMyOrders);

router.put('/:orderId/cancel', isCustomer, notificationController.customerCancelOrder);

router.post('/:id/repurchase', isCustomer, orderController.repurchase);

module.exports = router;
