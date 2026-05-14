const Product = require('../models/Product');
const Review = require('../models/Review'); // Nạp bảng lưu trữ bình luận chat vừa tạo
const mongoose = require('mongoose'); // Nạp mongoose ở đầu nếu chưa có

// 1. Lấy danh sách sản phẩm (Giữ nguyên cấu trúc lọc và sắp xếp cũ của bạn)
exports.getProducts = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let filter = { isActive: true };

    if (category && ['tank', 'food', 'accessory', 'reptile', 'hamster', 'medicine', 'clothing', 'fish'].includes(category)) {
      filter.category = category;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc') sortOption = { price: 1 };
    if (sort === 'price-desc') sortOption = { price: -1 };

    const products = await Product.find(filter).sort(sortOption);
    res.render('products', { 
      title: 'Sản phẩm', 
      products, 
      category: category || '',
      search: search || '',
      sort: sort || ''
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

// 2. Lấy chi tiết sản phẩm cao cấp (Đồng bộ: Sản phẩm tương tự + Bình luận phòng chat)
exports.getProductDetail = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect('/products');

    // Tìm các sản phẩm liên quan (Cùng danh mục, loại trừ chính nó, giới hạn lấy tối đa 8 mẫu)
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true
    }).limit(8);

    // Lấy toàn bộ danh sách tin nhắn phòng chat thuộc sản phẩm này (Sắp xếp tin cũ lên trước, tin mới sau)
    const reviews = await Review.find({ productId: product._id }).sort({ createdAt: 1 });

    res.render('product-detail', { 
      title: product.name, 
      product,
      relatedProducts, // Truyền sang giao diện thanh cuộn ngang
      reviews          // Truyền sang giao diện khung hội thoại chat công khai
    });
  } catch (err) {
    console.error(err);
    res.redirect('/products');
  }
};

// 3. Xử lý lưu tin nhắn chat & Điểm đánh giá sao từ giao diện vào Database
exports.createProductReview = async (req, res) => {
  try {
    const productId = req.params.id;
    const { rating, comment } = req.body;

    // Lấy thông tin tài khoản đang đăng nhập từ Session hệ thống (Khớp với app.js)
    const currentUser = req.session.user;

    // SỬA TẠI ĐÂY: Khởi tạo dữ liệu ID an toàn, không bị undefined nếu chưa đăng nhập
    let userId;
    let userName = 'Test User';
    let userRole = 'user';

    if (currentUser && currentUser._id) {
      userId = currentUser._id;
      userName = currentUser.name;
      userRole = currentUser.role || 'user';
    } else {
      // Nếu session trống (chưa đăng nhập), tự động sinh một ObjectId hợp lệ của Mongoose làm ID dự phòng
      userId = new mongoose.Types.ObjectId();
    }

    // Khởi tạo dòng dữ liệu để ghi vào bảng Reviews
    const newReview = new Review({
      productId: productId,
      userId: userId, // Chắc chắn có giá trị ObjectId hợp lệ, không bao giờ bị required error
      userName: userName,
      userRole: userRole,
      rating: Number(rating) || 0,
      comment: comment.trim()
    });

    // Lưu dữ liệu vào MongoDB
    await newReview.save();
    console.log("=== HỆ THỐNG: ĐÃ LƯU THÀNH CÔNG BÌNH LUẬN VÀO DATABASE ===");

    // Quay trở lại trang chi tiết sản phẩm ngay lập tức để nạp dữ liệu mới
    res.redirect(`/products/${productId}`);
  } catch (err) {
    console.error("Lỗi nghiêm trọng khi lưu dữ liệu bình luận:", err);
    res.redirect(`/products/${req.params.id}`);
  }
};


