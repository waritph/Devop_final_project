const express = require('express');
const { Order, OrderItem } = require('../models/Order');
const { User } = require('../models/User');
const logger = require('../utilities/logger');
const { Game } = require('../models/Game'); // 添加 Game 模型导入
const { paginate } = require('../utilities/paginate');

const orderController = express.Router();

orderController.get('/', async (req, res) => {
    try {
        logger.info('Accessing /staff/orders');
        let filter = {};
        let { status, page, owner } = req.query;
        if (!page) page = 1;
        if (status && status !== "any") filter.status = status;
        if (owner) filter.owner_id = owner;

        const id = req.session.userId;
        logger.info(`Session userId: ${id}`);
        if (!id) {
            logger.error('No user ID in session');
            return res.redirect('/auth/signin?q=session-expired');
        }

        const user = await User.findByPk(id);
        if (!user) {
            logger.error(`User not found for ID: ${id}`);
            throw new Error('User not found');
        }
        if (user.role !== 'staff') {
            logger.error(`User ${id} is not a staff member`);
            throw new Error('Unauthorized');
        }

        logger.info('Fetching orders...');
        const orders = await Order.findAll({
            where: filter,
            order: [['status', 'ASC'], ['updatedAt', 'DESC']],
            include: [
                { model: OrderItem, as: 'records', include: [{ model: Game, as: 'item' }] },
                { model: User, as: 'User' } // 加载 User 数据
            ]
        });
        logger.info(`Found ${orders.length} orders`);

        logger.info('Paginating orders...');
        const paginateOrders = paginate(orders, page, 10);

        logger.info('Fetching user list...');
        const userList = await User.findAll();
        logger.info(`Found ${userList.length} users`);

        logger.info('Rendering manageOrders.ejs...');
        res.render('staffPages/manageOrders', { user, userList, data: paginateOrders, status, page, owner });
    } catch (err) {
        logger.error('Manage orders error: ' + err.message + '\n' + err.stack);
        res.status(500).render('publicPages/error', { error: 'Sorry, we had some technical problems during your last operation. Please try again later.' });
    }
});

orderController.post('/update', async (req, res) => {
    try {
        const { order_id, updatedStatus } = req.body;
        const user = await User.findByPk(req.session.userId);
        if (!user || user.role !== 'staff') throw new Error('Unauthorized');

        await Order.update({ status: updatedStatus }, { where: { id: order_id } });
        res.redirect('/staff/orders');
    } catch (err) {
        logger.error('Update order error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

orderController.get('/update/:id', async (req, res) => {
    try {
        const id = req.session.userId;
        const user = await User.findByPk(id);
        if (!user || user.role !== 'staff') throw new Error('Unauthorized');

        const orderId = req.params.id;
        const order = await Order.findByPk(orderId, {
            include: [{ model: OrderItem, as: 'records', include: [{ model: Game, as: 'item' }] }]
        });
        if (!order) throw new Error('Order not found');

        res.render('staffPages/orderDetail', { user, order });
    } catch (err) {
        logger.error('Order form error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

module.exports = orderController;