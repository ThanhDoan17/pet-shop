const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/images/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

router.use(isAdmin);

router.get('/', adminController.getDashboard);
router.get('/products', adminController.getProducts);
router.get('/products/add', adminController.getAddProduct);
router.post('/products/add', upload.single('image'), adminController.postAddProduct);
router.get('/products/edit/:id', adminController.getEditProduct);
router.post('/products/edit/:id', upload.single('image'), adminController.postEditProduct);
router.post('/products/delete/:id', adminController.deleteProduct);
router.get('/statistics', adminController.getStatistics);
router.get('/orders', adminController.getOrders);
router.post('/orders/:id/status', adminController.updateOrderStatus);

router.get('/reviews', adminController.getReviews);
router.post('/reviews/:reviewId/reply', adminController.postAdminReply);
router.post('/reviews/:reviewId/delete-reply', adminController.deleteAdminReply);

router.get('/users', adminController.getUsers);
router.post('/users/:id/role', adminController.updateUserRole);
router.post('/users/:id/delete', adminController.deleteUser);

module.exports = router;