const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getRegister = (req, res) => {
  res.render('auth/register', { title: 'Dang ky', error: null });
};

exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
      return res.render('auth/register', { title: 'Dang ky', error: 'Mat khau khong khop' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('auth/register', { title: 'Dang ky', error: 'Email da duoc su dung' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
    if (user.role === 'admin') return res.redirect('/admin');
    if (user.role === 'staff') return res.redirect('/staff/inventory');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('auth/register', { title: 'Dang ky', error: 'Co loi xay ra' });
  }
};

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Dang nhap', error: null });
};

exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.render('auth/login', { title: 'Dang nhap', error: 'Email khong ton tai' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render('auth/login', { title: 'Dang nhap', error: 'Mat khau khong dung' });
    }
    req.session.user = { id: user._id, name: user.name, email: user.email, role: user.role };
    // Restore giỏ hàng từ database
    if (user.cart && user.cart.length > 0) {
    req.session.cart = user.cart.map(item => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity
    }));
    }
    if (user.role === 'admin') return res.redirect('/admin');
    if (user.role === 'staff') return res.redirect('/staff/inventory');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('auth/login', { title: 'Dang nhap', error: 'Co loi xay ra' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    res.redirect('/auth/login');
  });
};

exports.getChangePassword = (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  res.render('auth/change-password', { title: 'Doi mat khau', error: null, success: null });
};

exports.postChangePassword = async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.render('auth/change-password', { title: 'Doi mat khau', error: 'Mat khau moi khong khop', success: null });
    }
    const user = await User.findById(req.session.user.id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.render('auth/change-password', { title: 'Doi mat khau', error: 'Mat khau hien tai khong dung', success: null });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.render('auth/change-password', { title: 'Doi mat khau', error: null, success: 'Doi mat khau thanh cong!' });
  } catch (err) {
    res.render('auth/change-password', { title: 'Doi mat khau', error: 'Co loi xay ra', success: null });
  }
};