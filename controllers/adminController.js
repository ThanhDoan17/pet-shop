const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

const upload = require('../config/multer');

exports.dashboard = async (req, res) => {   
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      pageTitle: 'Trang tổng quan',
      currentPage: 'dashboard',
      user: req.session.user,
      totalProducts, 
      totalOrders, 
      pendingOrders
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { search, sort } = req.query;
    let filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    
    let sortOption = { createdAt: -1 };
    if (sort === 'stock-asc') sortOption = { stock: 1 };
    if (sort === 'stock-desc') sortOption = { stock: -1 };
    if (sort === 'name') sortOption = { name: 1 };

    const products = await Product.find(filter).sort(sortOption);
    const isStaffUser = req.session.user && req.session.user.role === 'staff';
    const view = isStaffUser ? 'staff/inventory' : 'admin/products';
    res.render(view, {
  title: isStaffUser ? 'Quản lý tồn kho' : 'Quản lý sản phẩm',
  pageTitle: isStaffUser ? 'Quản lý tồn kho' : 'Quản lý sản phẩm',
  currentPage: isStaffUser ? 'inventory' : 'products',
  user: req.session.user,
  products, search: search || '', sort: sort || ''
});
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
};

exports.getAddProduct = (req, res) => {
  const isStaffUser = req.session.user && req.session.user.role === 'staff';
  const formAction = isStaffUser ? '/staff/products/add' : '/admin/products/add';
res.render('admin/product-form', {
  title: 'Thêm sản phẩm',
  pageTitle: 'Thêm sản phẩm mới',
  currentPage: 'add-product',
  user: req.session.user,
  product: null, error: null, formAction});
};

exports.postAddProduct = [
  upload.single('image'),   // Middleware upload
  async (req, res) => {
    try {
      const { name, description, price, category, stock } = req.body;

      let image = '/images/default.jpg';
      if (req.file) {
        image = req.file.path;           // <-- Đây là URL từ Cloudinary
      }

      const product = new Product({
        name,
        description,
        price: Number(price),
        category,
        stock: Number(stock),
        image,
        isActive: true
      });

      await product.save();

      const redirectTo = req.session.user.role === 'staff' ? '/staff/inventory' : '/admin/products';
      res.redirect(redirectTo);
    } catch (err) {
      console.error(err);
      const redirectTo = req.session.user.role === 'staff' ? '/staff/inventory' : '/admin/products';
      res.redirect(redirectTo);
    }
  }
];

exports.getEditProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect('/admin/products');
    const isStaffUser = req.session.user && req.session.user.role === 'staff';
    const formAction = isStaffUser ? `/staff/products/edit/${product._id}` : `/admin/products/edit/${product._id}`;
res.render('admin/product-form', {
  title: 'Sửa sản phẩm',
  pageTitle: 'Chỉnh sửa sản phẩm',
  currentPage: 'products',
  user: req.session.user,
  product, error: null, formAction
});  } catch (err) {
    res.redirect('/admin/products');
  }
};

exports.postEditProduct = [
  upload.single('image'),
  async (req, res) => {
    try {
      const { name, description, price, category, stock } = req.body;
      
      const update = { 
        name, 
        description, 
        price: Number(price), 
        category, 
        stock: Number(stock) 
      };

      if (req.file) {
        update.image = req.file.path;     // <-- URL Cloudinary
      }

      await Product.findByIdAndUpdate(req.params.id, update);

      const redirectTo = req.session.user.role === 'staff' ? '/staff/inventory' : '/admin/products';
      res.redirect(redirectTo);
    } catch (err) {
      console.error(err);
      const redirectTo = req.session.user.role === 'staff' ? '/staff/inventory' : '/admin/products';
      res.redirect(redirectTo);
    }
  }
];

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/admin/products');
  } catch (err) {
    res.redirect('/admin/products');
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    
    const statusOrder = { 'pending': 0, 'confirmed': 1, 'shipping': 2, 'delivered': 3, 'cancelled': 4 };
    orders.sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }s
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const isStaffUser = req.session.user && req.session.user.role === 'staff';
    const view = isStaffUser ? 'staff/orders' : 'admin/orders';
    res.render(view, {
  title: 'Quản lý đơn hàng',
  pageTitle: 'Quản lý đơn hàng',
  currentPage: 'orders',
  user: req.session.user,
  orders
});
  } catch (err) {
    res.redirect('/');
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.redirect(req.get('Referer') || '/admin/orders');

    await Order.findByIdAndUpdate(req.params.id, { status });

    // Tạo thông báo khi đơn hàng được giao thành công
    if (status === 'delivered' && order.status !== 'delivered') {
      const { createDeliveredNotification } = require('./notificationController');
      const orderCode = order._id.toString().slice(-6).toUpperCase();
      await createDeliveredNotification(order.user, order._id, orderCode);
    }

    const referer = req.get('Referer') || '/admin/orders';
    res.redirect(referer);
  } catch (err) {
    console.error(err);
    res.redirect(req.get('Referer') || '/admin/orders');
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const { type = 'month', year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;
    const products = await Product.find({ isActive: true });
    const totalProducts = products.length;
    const prices = products.map(p => p.price);
    const maxPrice = prices.length ? Math.max(...prices) : 0;
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

    let matchStage = {};
    let groupStage = {};
    let labelFormat = '';

    if (type === 'day') {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      matchStage = { createdAt: { $gte: start, $lte: end } };
      groupStage = { _id: { $dayOfMonth: '$createdAt' }, total: { $sum: '$totalPrice' }, count: { $sum: 1 } };
      labelFormat = 'Ngay';
    } else if (type === 'month') {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59);
      matchStage = { createdAt: { $gte: start, $lte: end } };
      groupStage = { _id: { $month: '$createdAt' }, total: { $sum: '$totalPrice' }, count: { $sum: 1 } };
      labelFormat = 'Thang';
    } else {
      groupStage = { _id: { $year: '$createdAt' }, total: { $sum: '$totalPrice' }, count: { $sum: 1 } };
      labelFormat = 'Nam';
    }

    const orderStats = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, ...matchStage } },
      { $group: groupStage },
      { $sort: { _id: 1 } }
    ]);

    const totalOrders = await Order.countDocuments({ status: { $ne: 'cancelled' } });
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const revenue = totalRevenue[0]?.total || 0;

    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalQty: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalQty: -1 } },
      { $limit: 5 }
    ]);

    res.render('admin/statistics', {
  title: 'Thống kê & Báo cáo',
  pageTitle: 'Thống kê & Báo cáo',
  currentPage: 'statistics',
  user: req.session.user,
  totalProducts, maxPrice, minPrice,
  avgPrice: Math.round(avgPrice),
  totalValue, totalOrders, revenue,
  orderStats, topProducts,
  type, year: parseInt(year), month: parseInt(month), labelFormat
});
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    await Product.findByIdAndUpdate(req.params.id, { stock: parseInt(stock) });
    res.redirect('/staff/inventory');
  } catch (err) {
    res.redirect('/staff/inventory');
  }
};

exports.getInventory = async (req, res) => {
  try {
    const products = await Product.find().sort({ stock: 1 });
    res.render('staff/inventory', { title: 'Quan ly ton kho', products, search: '' });
  } catch (err) {
    res.redirect('/staff/orders');
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.render('admin/users', {
  title: 'Quản lý người dùng',
  pageTitle: 'Quản lý người dùng',
  currentPage: 'users',
  user: req.session.user,
  users, search: search || ''
});
  } catch (err) {
    res.redirect('/admin');
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { role: req.body.role });
    res.redirect('/admin/users');
  } catch (err) {
    res.redirect('/admin/users');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
  } catch (err) {
    res.redirect('/admin/users');
  }
};

// Trang quản lý phản hồi đánh giá
exports.getReviews = async (req, res) => {
  try {
    const Review = require('../models/Review');
    const { search } = req.query;
    let filter = {};
    if (search) filter.comment = { $regex: search, $options: 'i' };

    const reviews = await Review.find(filter)
      .populate('productId', 'name image')
      .sort({ createdAt: -1 });

    res.render('admin/reviews', {
      title: 'Quản lý phản hồi',
      pageTitle: 'Quản lý phản hồi',
      currentPage: 'reviews',
      user: req.session.user,
      reviews,
      search: search || ''
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
  }
};

// Xử lý phản hồi từ trang admin
exports.postAdminReply = async (req, res) => {
  try {
    const Review = require('../models/Review');
    const { reviewId } = req.params;
    const { reply } = req.body;
    const currentUser = req.session.user;

    await Review.findByIdAndUpdate(reviewId, {
      reply: reply.trim(),
      replyAt: new Date(),
      replyBy: currentUser.name
    });

    res.redirect('/admin/reviews');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/reviews');
  }
};

// Xóa phản hồi từ trang admin
exports.deleteAdminReply = async (req, res) => {
  try {
    const Review = require('../models/Review');
    await Review.findByIdAndUpdate(req.params.reviewId, {
      reply: '', replyAt: null, replyBy: ''
    });
    res.redirect('/admin/reviews');
  } catch (err) {
    res.redirect('/admin/reviews');
  }
};