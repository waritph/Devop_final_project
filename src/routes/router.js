const express = require('express');
const router = require('express').Router();
const { log } = require('../middleware');
const { authentication, secureRoute } = require('../middleware/auth');
const { Cart } = require('../models/Cart');
const { Game } = require('../models/Game');
const { User } = require('../models/User');
const logger = require('../utilities/logger');
const { paginate } = require('../utilities/paginate');
const staffRouter = require('./staff.router');
const userRouter = require('./user.router');
const authController = require('../controllers/auth.controller');
const gameController = require('../controllers/game.controller');
const { Op } = require('sequelize');

router.use(log);

// 首页路由
router.get('/', async (req, res) => {
    let user = null;
    try {
        const id = req.session.userId;
        if (id) {
            user = await User.findByPk(id);
            if (user && user.role === 'staff') {
                return res.redirect('/staff/dashboard');
            }
        }
        res.status(200).render('index', { title: "Welcome to Game Shop", user: user || null });
    } catch (err) {
        logger.error('Root route error:', err);
        res.status(500).render('publicPages/error', { error: 'Server error' });
    }
});

// 关于页面
router.get('/about', async (req, res) => {
    let user = null;
    try {
        const id = req.session.userId;
        if (id) user = await User.findByPk(id);
        res.render('publicPages/about', { user });
    } catch (err) {
        logger.error('About route error:', err);
        res.status(500).render('publicPages/error', { error: 'Server error' });
    }
});

// 联系页面
router.get('/contact', async (req, res) => {
    let user = null;
    try {
        const id = req.session.userId;
        if (id) user = await User.findByPk(id);
        res.render('publicPages/contact', { user });
    } catch (err) {
        logger.error('Contact route error:', err);
        res.status(500).render('publicPages/error', { error: 'Server error' });
    }
});

// 游戏列表页面
router.get('/games', async (req, res) => {
    try {
        const user = req.session.userId ? await User.findByPk(req.session.userId) : null;
        const cart = await Cart.loadToSession(req.session.userId, req.session);
        let { genre, page, title } = req.query;
        let filter = { is_outofstock: false };
        if (genre && genre !== 'any') filter.genre = genre;
        if (title) filter.title = { [Op.like]: `%${title}%` };

        const games = await Game.findAll({
            where: filter,
            order: [['title', 'ASC']]
        });
        const paginateGames = paginate(games, page || 1, 15);

        res.render('publicPages/games', {
            user,
            cart: cart.toArray(),
            cartTotal: cart.totalPrice,
            data: paginateGames,
            genre: genre || 'any',
            page: page || 1,
            title: title || ''
        });
    } catch (err) {
        logger.error('Games route error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

// 游戏详情页面
router.get('/game/:id', async (req, res) => {
    try {
        let user = null;
        const id = req.session.userId;
        if (id) user = await User.findByPk(id);

        const gameId = req.params.id;
        const game = await Game.findByPk(gameId);
        if (!game) throw new Error('Game not found');

        res.render('publicPages/gameDetail', { user, game });
    } catch (err) {
        logger.error('Game detail route error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

router.post('/cart/add', gameController);
router.post('/cart/remove', gameController);

router.use('/staff', secureRoute, staffRouter);
router.use('/user', authentication, userRouter);
router.use('/auth', authController);

router.use('*', (req, res) => {
    res.render('publicPages/404');
});

module.exports = router;