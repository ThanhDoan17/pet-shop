// middleware/auth.js

// 1. Kiểm tra người dùng bất kỳ đã đăng nhập phiên làm việc chưa
const isLoggedIn = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect('/auth/login');
};

// 2. Kiểm tra quyền hạn quản trị viên cấp cao (Admin)
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.redirect('/');
};

// 3. Kiểm tra quyền hạn nhân viên hệ thống hoặc admin
const isStaff = (req, res, next) => {
  if (req.session.user && ['admin', 'staff'].includes(req.session.user.role)) return next();
  res.redirect('/auth/login');
};

// 4. Kiểm tra và mở khóa quyền hạn cho Khách hàng (User/Customer)
const isCustomer = (req, res, next) => {
  // Nếu chưa đăng nhập, ép chuyển hướng về trang đăng nhập
  if (!req.session.user) return res.redirect('/auth/login');
  
  // Chặn trường hợp Admin hoặc Staff cố tình truy cập luồng xử lý của khách hàng
  if (['admin', 'staff'].includes(req.session.user.role)) {
    return res.redirect('/');
  }
  
  // Cho phép đi qua nếu là khách hàng thông thường
  next();
};

// Xuất bản đầy đủ tất cả các hàm để chống lỗi ReferenceError hệ thống
module.exports = { isLoggedIn, isAdmin, isStaff, isCustomer };
