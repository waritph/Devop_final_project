const express = require('express');
const { Cart, CartModel } = require('../models/Cart');
const { Game } = require('../models/Game');
const { Order, OrderItem } = require('../models/Order');
const { User } = require('../models/User');
const logger = require('../utilities/logger');
const generatePayload = require('promptpay-qr');
const QRCode = require('qrcode');
const multer = require('multer');

const userRouter = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// 用户仪表盘
userRouter.get('/', async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = userId ? await User.findByPk(userId) : null;
        res.render('userPages/dashboard', { user });
    } catch (err) {
        logger.error('User dashboard error:', err);
        res.status(500).render('publicPages/error', { error: 'Server error' });
    }
});

// 结账页面
userRouter.get('/checkout', async (req, res) => {
    try {
        const id = req.session.userId;
        const user = await User.findByPk(id);
        const cart = await Cart.loadToSession(id, req.session);
        res.render('userPages/checkout', { user, cart });
    } catch (err) {
        logger.error('Checkout error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

// 处理结账
userRouter.post('/checkout', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!req.session.cart || req.session.cart.totalQty == 0) throw new Error("Cart is empty");
        const cart = await Cart.loadToSession(userId, req.session);

        const { houseNumber, amphoe, district, province, country, zipcode, note, firstname, lastname, telephone } = req.body;
        const owner_id = userId;
        const address = `${houseNumber}, ${amphoe}, ${district}, ${province}, ${zipcode}, ${country}`;
        const shipping_price = 15;

        let records = [];
        let product_price = 0;
        cart.toArray().forEach(record => {
            const price = record.item.price_promotion !== null ? record.item.price_promotion : record.item.price;
            product_price += record.qty * price;
            records.push({
                item_id: record.item.id,
                qty: record.qty,
                platform: record.platform || 'pc'
            });
        });

        const order = await Order.create({
            owner_id,
            destination: address,
            shipping_price,
            product_price,
            total_price: product_price + shipping_price,
            note,
            firstname,
            lastname,
            telephone
        });

        records = records.map(record => ({ ...record, order_id: order.id }));
        await OrderItem.bulkCreate(records);

        await CartModel.destroy({ where: { userId } });
        req.session.cart = null;

        res.redirect(`/user/order/${order.id}`);
    } catch (err) {
        logger.error('Checkout post error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

// 添加到购物车
userRouter.post('/cart', async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findByPk(userId);
        if (!user) throw new Error('Please log in to add items to cart');

        const { id, qty, platform } = req.body;
        const gameDoc = await Game.findByPk(id);
        if (!gameDoc) throw new Error('Game not found');

        await Cart.addItem(userId, gameDoc, Number(qty), platform);
        await Cart.loadToSession(userId, req.session);

        res.json({ "status": "success" });
    } catch (err) {
        logger.error('Cart add error:', err);
        res.json({ "status": "error", message: err.message });
    }
});

// 查看购物车
userRouter.get('/cart', async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findByPk(userId);
        if (!user) return res.redirect('/auth/signin');

        const cart = await Cart.loadToSession(userId, req.session);
        const cartItems = cart.toArray();

        res.render('userPages/cart', {
            user,
            cartItems,
            totalQty: cart.totalQty,
            totalPrice: cart.totalPrice
        });
    } catch (err) {
        logger.error('Cart error:', err);
        res.status(500).render('publicPages/error', { error: 'Server error' });
    }
});

// 从购物车移除单个项（用于购物车页面）
userRouter.post('/cart/remove', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) throw new Error("Please log in");
        const { gameId } = req.body;

        if (!gameId) throw new Error("Game ID is required");

        await Cart.removeItem(userId, gameId);
        await Cart.loadToSession(userId, req.session);

        res.redirect('/user/cart');
    } catch (err) {
        logger.error('Cart remove error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

// 从游戏列表移除单个项（修复）
userRouter.get('/remove/:id', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect('/auth/signin'); // 未登录时重定向到登录页
        const gameId = req.params.id;
        const { category, page } = req.query;

        await Cart.removeItem(userId, gameId);
        await Cart.loadToSession(userId, req.session);

        // 确保 category 和 page 有默认值
        const safeCategory = category || 'any';
        const safePage = page || 1;
        res.redirect(`/games?genre=${safeCategory}&page=${safePage}`);
    } catch (err) {
        logger.error('Cart remove from games error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

// 清空购物车
userRouter.post('/cart/clear', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) throw new Error("Please log in");

        await CartModel.destroy({ where: { userId } });
        req.session.cart = null;

        res.redirect('/user/cart');
    } catch (err) {
        logger.error('Cart clear error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

// 查看订单历史
userRouter.get('/orders', async (req, res) => {
    try {
        const owner_id = req.session.userId;
        let filter = { owner_id };
        const { status } = req.query;
        if (status && status !== 'any') filter.status = status;

        const user = await User.findByPk(owner_id);
        const orders = await Order.findAll({
            where: filter,
            include: [{ model: OrderItem, as: 'records', include: [{ model: Game, as: 'item' }] }]
        });
        res.render('userPages/orderHistory', { user, data: orders });
    } catch (err) {
        logger.error('Orders fetch error:', err);
        res.status(500).render('publicPages/error', { error: 'Server error' });
    }
});

// 查看订单详情
userRouter.get('/order/:orderId', async (req, res) => {
    try {
        const id = req.session.userId;
        const user = await User.findByPk(id);
        if (!user) throw new Error('Unauthorized');

        const orderId = req.params.orderId;
        const order = await Order.findByPk(orderId, {
            include: [{ model: OrderItem, as: 'records', include: [{ model: Game, as: 'item' }] }]
        });
        if (!order || order.owner_id !== user.id) throw new Error('Order not found or access denied');

        const payload = generatePayload('0910677794', { amount: Number(order.total_price) });
        const qr_code = await QRCode.toDataURL(payload);
        res.render('userPages/orderDetail', { qr_code, user, order });
    } catch (err) {
        logger.error('Order detail error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

// 上传支付凭证
userRouter.post('/order/:orderId/upload-proof', upload.single('paymentProof'), async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findByPk(orderId);
        if (!order) throw new Error('Order not found');

        await Order.update(
            { paymentProof: `/public/uploads/${req.file.filename}`, status: 'processing' },
            { where: { id: orderId } }
        );

        res.redirect(`/user/order/${orderId}`);
    } catch (err) {
        logger.error('Upload proof error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

module.exports = userRouter;