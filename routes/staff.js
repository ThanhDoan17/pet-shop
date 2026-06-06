const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isStaff } = require('../middleware/auth');

const upload = require('../config/multer');  

router.use(isStaff);

router.get('/orders', adminController.getOrders);
router.post('/orders/:id/status', adminController.updateOrderStatus);
router.get('/inventory', adminController.getProducts);
router.post('/inventory/:id/stock', adminController.updateStock);

router.get('/products/add', adminController.getAddProduct);
router.post('/products/add', upload.single('image'), adminController.postAddProduct);

router.get('/products/edit/:id', adminController.getEditProduct);
router.post('/products/edit/:id', upload.single('image'), adminController.postEditProduct);

module.exports = router;