const express = require('express');
const gameController = require('../controllers/game.controller');
const orderController = require('../controllers/order.controller');
const { User } = require('../models/User');
const logger = require('../utilities/logger');

const staffRouter = express.Router();

// 仪表盘路由
staffRouter.get('/dashboard', async (req, res) => {
    try {
        const user = await User.findByPk(req.session.userId);
        if (!user || user.role !== 'staff') {
            throw new Error('Unauthorized');
        }
        res.render('staffPages/dashboard', { user });
    } catch (err) {
        logger.error('Staff dashboard error:', err);
        res.status(403).render('publicPages/error', { error: 'Access denied' });
    }
});

// 将 /games 路由委托给 gameController
staffRouter.use('/games', gameController);

// 将 /orders 路由委托给 orderController
staffRouter.use('/orders', orderController);

module.exports = staffRouter;