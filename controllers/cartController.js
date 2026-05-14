const User = require('../models/User');

async function saveCartToDB(req) {
  if (req.session.user) {
    await User.findByIdAndUpdate(req.session.user.id, {
      cart: req.session.cart || []
    });
  }
}

exports.getCart = (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.render('cart', { title: 'Gio hang', cart, total });
};

exports.addToCart = async (req, res) => {
  if (req.session.user && req.session.user.role !== 'user') return res.redirect('/');
  const Product = require('../models/Product');
  try {
    const { productId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;
    const product = await Product.findById(productId);
    if (!product) return res.redirect('/products');

    if (!req.session.cart) req.session.cart = [];

    const existingIndex = req.session.cart.findIndex(i => i.productId === productId);
    if (existingIndex >= 0) {
      req.session.cart[existingIndex].quantity += qty;
    } else {
      req.session.cart.push({
        productId,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: qty
      });
    }

    await saveCartToDB(req);
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    res.redirect('/products');
  }
};

exports.updateCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const qty = parseInt(quantity);
  if (!req.session.cart) return res.redirect('/cart');

  if (qty <= 0) {
    req.session.cart = req.session.cart.filter(i => i.productId !== productId);
  } else {
    const item = req.session.cart.find(i => i.productId === productId);
    if (item) item.quantity = qty;
  }

  await saveCartToDB(req);
  res.redirect('/cart');
};

exports.removeFromCart = async (req, res) => {
  const { productId } = req.body;
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(i => i.productId !== productId);
  }

  await saveCartToDB(req);
  res.redirect('/cart');
};