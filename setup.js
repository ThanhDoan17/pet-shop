const fs = require('fs');

const controller = `const User = require('../models/User');
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
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('auth/login', { title: 'Dang nhap', error: 'Co loi xay ra' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};`;

fs.writeFileSync('./controllers/authController.js', controller, 'utf8');
console.log('authController.js created OK');