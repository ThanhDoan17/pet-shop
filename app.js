const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const path = require('path');
require('dotenv').config();
console.log('connect-mongo version:', require('./node_modules/connect-mongo/package.json').version);

const connectDB = require('./config/db');
connectDB();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'petshop_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI, collectionName: 'sessions' }),  
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// ==========================================
// ĐOẠN ĐƯỢC NÂNG CẤP (Bảo toàn biến cũ và thêm bộ đếm thông báo)
// ==========================================
app.use(async (req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.cartCount = req.session.cart ? req.session.cart.length : 0;
  
  // Khởi tạo biến lưu số thông báo chưa đọc toàn cục cho EJS sử dụng
  res.locals.unreadNotificationsCount = 0; 

  // Nếu người dùng (Khách/Staff/Admin) đã đăng nhập, tiến hành đếm số thông báo chưa đọc thực tế
  if (req.session.user) {
    try {
      const Notification = require('./models/Notification');
      res.locals.unreadNotificationsCount = await Notification.countDocuments({
        userId: req.session.user.id,
        isRead: false
      });
    } catch (err) {
      console.error("Lỗi đếm số lượng thông báo tại app.js middleware:", err);
    }
  }
  next();
});
// ==========================================

const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const productRoutes = require('./routes/products');
app.use('/products', productRoutes);

const cartRoutes = require('./routes/cart');
app.use('/cart', cartRoutes);

const orderRoutes = require('./routes/orders');
app.use('/orders', orderRoutes);

const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

const staffRoutes = require('./routes/staff');
app.use('/staff', staffRoutes);

const notificationRoutes = require('./routes/notifications');
app.use('/notifications', notificationRoutes);

const messageRoutes = require('./routes/messages');
app.use('/messages', messageRoutes);

app.get('/api/featured-products', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 }).limit(8);
    res.json(products);
  } catch (err) {
    res.json([]);
  }
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'Gioi thieu' });
});

app.get('/revenue', async (req, res) => {
  try {
    const Order = require('./models/Order');

    // Thống kê theo tháng trong năm hiện tại
    const year = new Date().getFullYear();
    const monthlyStats = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31, 23, 59, 59) } } },
      { $group: { _id: { $month: '$createdAt' }, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Thống kê theo năm
    const yearlyStats = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: { $year: '$createdAt' }, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Thống kê theo danh mục
    const categoryStats = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, qty: { $sum: '$items.quantity' } } },
      { $sort: { revenue: -1 } },
      { $limit: 8 }
    ]);

    const totalRevenue = monthlyStats.reduce((s, i) => s + i.revenue, 0);
    const totalOrders = monthlyStats.reduce((s, i) => s + i.orders, 0);

    res.render('revenue', {
      title: 'Thong ke doanh thu',
      monthlyStats: JSON.stringify(monthlyStats),
      yearlyStats: JSON.stringify(yearlyStats),
      categoryStats: JSON.stringify(categoryStats),
      totalRevenue,
      totalOrders,
      year
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

app.get('/', (req, res) => {
  if (req.session.user && req.session.user.role === 'admin') return res.redirect('/admin');
  if (req.session.user && req.session.user.role === 'staff') return res.redirect('/staff/inventory');
  res.render('index', { title: 'Pet Shop' });
});
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const url = process.env.RENDER_URL || '';
    if (url) require('https').get(url).on('error', () => {});
  }, 10 * 60 * 1000);
}
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
