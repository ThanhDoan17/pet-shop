const User = require('../models/User');
const Order = require('../models/Order');

exports.getCheckout = (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cart');
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.render('checkout', { title: 'Thanh toán', cart, total, error: null });
};

exports.postCheckout = async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  try {
    const cart = req.session.cart || [];
    if (cart.length === 0) return res.redirect('/cart');

    const { fullName, phone, address, city, note, paymentMethod } = req.body;
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = new Order({
      user: req.session.user.id,
      items: cart.map(item => ({
        product: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      totalPrice: total,
      shippingAddress: { fullName, phone, address, city },
      paymentMethod: paymentMethod || 'cod',
      note: note || ''
    });

    await order.save();
    req.session.cart = [];
    if (req.session.user) {
  await User.findByIdAndUpdate(req.session.user.id, { cart: [] });
}
    res.redirect('/orders/success/' + order._id);
  } catch (err) {
    console.error(err);
    const cart = req.session.cart || [];
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    res.render('checkout', { title: 'Thanh toán', cart, total, error: 'Có lỗi xảy ra, thử lại' });
  }
};

exports.getSuccess = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    res.render('order-success', { title: 'Đặt hàng thành công', order });
  } catch (err) {
    res.redirect('/');
  }
};

exports.getMyOrders = async (req, res) => {
  if (!req.session.user) return res.redirect('/auth/login');
  try {
    const orders = await Order.find({ user: req.session.user.id }).sort({ createdAt: -1 });
    res.render('my-orders', { title: 'Đơn hàng của tôi', orders });
  } catch (err) {
    res.redirect('/');
  }
};