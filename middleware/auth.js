const isLoggedIn = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect('/auth/login');
};

const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.redirect('/');
};

const isStaff = (req, res, next) => {
  if (req.session.user && ['admin', 'staff'].includes(req.session.user.role)) return next();
  res.redirect('/auth/login');
};

const isCustomer = (req, res, next) => {
  if (!req.session.user) return res.redirect('/auth/login');
  if (req.session.user.role !== 'user') return res.redirect('/');
  next();
};

module.exports = { isLoggedIn, isAdmin, isStaff, isCustomer };