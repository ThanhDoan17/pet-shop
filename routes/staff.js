const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isStaff } = require('../middleware/auth');

router.use(isStaff);

router.get('/orders', adminController.getOrders);
router.post('/orders/:id/status', adminController.updateOrderStatus);
router.get('/inventory', adminController.getProducts);
router.post('/inventory/:id/stock', adminController.updateStock);

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.get('/products/add', adminController.getAddProduct);
router.post('/products/add', upload.single('image'), adminController.postAddProduct);

router.get('/products/edit/:id', adminController.getEditProduct);
router.post('/products/edit/:id', upload.single('image'), adminController.postEditProduct);

module.exports = router;