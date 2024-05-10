const express = require('express');
const router = express();

const session = require('express-session');
const { SESSION_SECRET } = process.env;
router.use(session({ secret:SESSION_SECRET }));

const userController = require('../controllers/userController');

const auth = require('../middleware/auth');


router.get('/', auth.isLogout,userController.loadLogin);
router.post('/', auth.isLogout,userController.login);
router.get('/register', auth.isLogout,userController.loadRegister);
router.post('/register', auth.isLogout,userController.register);
router.get('/home', auth.isLogin,userController.loadHome);
router.get('/logout', auth.isLogin,userController.logout);

module.exports = router;