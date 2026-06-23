const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

const upload = require('../config/multer.js');

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
  res.render('admin/product-form', {
    title: 'Thêm Sản Phẩm Mới',
    pageTitle: 'Thêm sản phẩm mới',
    currentPage: 'product-form',  
    user: req.session.user,
    product: null,
    error: null,
    formAction: '/admin/products/add'
  });
};

exports.postAddProduct = [
  (req, res, next) => {
    const upload = require('../config/multer');
    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err.message);
        return res.redirect('/admin/products/add?error=upload_failed');
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { name, description, price, category, stock } = req.body;

      if (!name || !category) {
        return res.redirect('/admin/products/add?error=missing_fields');
      }

      let image = '/images/default.jpg';
      if (req.file) {
        image = '/uploads/' + req.file.filename;
      }

      const product = new Product({
        name: name.trim(),
        description: description || '',
        price: Number(price) || 0,
        category,
        stock: Number(stock) || 0,
        image,
        isActive: true
      });

      await product.save();

      const isStaff = req.session.user && req.session.user.role === 'staff';
      res.redirect(isStaff ? '/staff/inventory' : '/admin/products');

    } catch (err) {
      console.error(err);
      res.redirect('/admin/products/add?error=save_failed');
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
  currentPage: 'product-form',
  user: req.session.user,
  product, error: null, formAction
});  } catch (err) {
    res.redirect('/admin/products');
  }
};

exports.postEditProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, image: imageUrl } = req.body;

    const updateData = {};

    if (name && name.trim() !== '') updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (category && category !== '') updateData.category = category;
    if (price && price !== '') updateData.price = Number(price);
    if (stock && stock !== '') updateData.stock = Number(stock);

    // Xử lý ảnh: ưu tiên file upload mới, sau đó mới dùng text field
    if (req.file) {
      updateData.image = '/uploads/' + req.file.filename;
      console.log("📸 New image uploaded:", updateData.image);
    } else if (imageUrl && imageUrl !== '') {
      updateData.image = imageUrl;
    }

    console.log("🔄 Raw body:", req.body);
    console.log("🔄 File:", req.file ? req.file.filename : "No file");
    console.log("🔄 Updating with data:", updateData);

    if (Object.keys(updateData).length === 0) {
      console.log("⚠️ No data to update");
      return res.redirect('/admin/products');
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      updateData,
      { new: true, runValidators: true }
    );

    console.log("✅ Product updated successfully:", updatedProduct.name);

    const isStaff = req.session.user && req.session.user.role === 'staff';
    const redirectTo = isStaff ? '/staff/inventory' : '/admin/products';
    res.redirect(redirectTo);

  } catch (err) {
    console.error("❌ Edit product error:", err);
    res.redirect('/admin/products');
  }
};

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
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // Sắp xếp theo trạng thái
    const statusOrder = { 'pending': 0, 'confirmed': 1, 'shipping': 2, 'delivered': 3, 'cancelled': 4 };
    orders.sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.render('admin/orders', {
      title: 'Quản lý Đơn hàng',
      pageTitle: 'Quản lý Đơn hàng',
      currentPage: 'orders',
      user: req.session.user,
      orders: orders   // ← Quan trọng nhất: Phải có dòng này
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin');
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

    const statusStats = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

  res.render('admin/statistics', {
  title: 'Thống kê & Báo cáo',
  pageTitle: 'Thống kê & Báo cáo',
  currentPage: 'statistics',
  user: req.session.user,
  totalProducts, maxPrice, minPrice,
  avgPrice: Math.round(avgPrice),
  totalValue, totalOrders, revenue,
  orderStats, topProducts, statusStats,
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
    const user = await User.findById(req.params.id);
    if (!user) return res.redirect('/admin/users');

    // Không cho thay đổi role của Admin chính
    if (user.role === 'admin' && (user.email === 'admin@petshop.com' || user.email.includes('admin'))) {
      return res.redirect('/admin/users');
    }

    await User.findByIdAndUpdate(req.params.id, { role: req.body.role });
    res.redirect('/admin/users');
  } catch (err) {
    res.redirect('/admin/users');
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.redirect('/admin/users');

    // Không cho xóa Admin chính
    if (user.role === 'admin' && (user.email === 'admin@petshop.com' || user.email.includes('admin'))) {
      return res.redirect('/admin/users');
    }

    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/users');
  } catch (err) {
    res.redirect('/admin/users');
  }
};

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