const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);
router.get('/login', authController.getLogin);

router.post('/login', authController.postLogin);

router.get('/logout', authController.logout);

router.get('/change-password', authController.getChangePassword);
router.post('/change-password', authController.postChangePassword);

module.exports = router;