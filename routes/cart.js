const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.post('/update', cartController.updateCart);
router.post('/remove', cartController.removeFromCart);

const { isCustomer } = require('../middleware/auth');

router.get('/', isCustomer, cartController.getCart);
router.post('/add', isCustomer, cartController.addToCart);
router.post('/update', isCustomer, cartController.updateCart);
router.post('/remove', isCustomer, cartController.removeFromCart);

module.exports = router;