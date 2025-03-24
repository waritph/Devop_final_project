const { User } = require('../models/User');
const logger = require('../utilities/logger');

module.exports.authentication = async (req, res, next) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.redirect('/auth/signin?q=session-expired');
    }
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.redirect('/auth/signin?q=session-expired');
        }
        req.user = user; // 将用户对象添加到 req，方便后续使用
        next();
    } catch (err) {
        logger.error(`Authentication error for userId ${userId}:`, err);
        res.render('publicPages/error', { error: 'Server error' });
    }
};

module.exports.secureRoute = async (req, res, next) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.redirect('/auth/signin?q=session-expired');
    }
    try {
        const user = await User.findByPk(userId);
        if (!user || user.role !== 'staff') {
            return res.render('publicPages/error', { error: { message: '403 Forbidden' } });
        }
        req.user = user;
        next();
    } catch (err) {
        logger.error(`Secure route error for userId ${userId}:`, err);
        res.render('publicPages/error', { error: 'Server error' });
    }
};