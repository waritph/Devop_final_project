const express = require('express');
const { User } = require('../models/User');
const bcrypt = require('bcrypt');
const logger = require('../utilities/logger');

const authController = new express.Router();

// 辅助函数
const findUser = async (key, value) => {
    try {
        return await User.findOne({ where: { [key]: value } });
    } catch (err) {
        logger.error(`Find user error (${key}: ${value}):`, err);
        throw new Error('Database error: Unable to query user');
    }
};

const isDuplicateUser = async ({ username }) => {
    const userByUsername = await findUser('username', username);
    if (userByUsername) return 'Username already exists';
    return null;
};

// 登录页面
authController.get('/signin', (req, res) => {
    const { username, q } = req.query;
    const alert = q === 'session-expired' ? { type: 'warning', message: 'Session expired.' } : null;
    res.render('publicPages/login', { username: username || '', alert });
});

// 注册页面
authController.get('/signup', (req, res) => {
    res.render('publicPages/register', { alert: null });
});

// 登出
authController.get('/signout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logger.error('Session destroy error:', err);
            return res.status(500).render('publicPages/error', { error: 'Logout failed' });
        }
        res.redirect('/');
    });
});

// 处理登录
authController.post('/signin', async (req, res) => {
    const { userInput, password } = req.body;

    try {
        const user = await findUser('username', userInput);
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.render('publicPages/login', {
                username: userInput,
                alert: { type: 'warning', message: 'Incorrect username or password.' }
            });
        }
        req.session.userId = user.id;
        req.session.role = user.role;
        res.redirect('/');
    } catch (err) {
        logger.error('Signin error:', err);
        res.status(500).render('publicPages/error', { error: 'Server error: Unable to sign in' });
    }
});

// 处理注册
authController.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 检查必填字段
        if (!username || !password) {
            return res.render('publicPages/register', {
                alert: { type: 'warning', message: 'Username and password are required' }
            });
        }

        // 检查重复用户
        const duplicateError = await isDuplicateUser({ username });
        if (duplicateError) {
            return res.render('publicPages/register', {
                alert: { type: 'warning', message: duplicateError }
            });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建用户
        const user = await User.create({
            username,
            password: hashedPassword,
            role: 'user'
        });

        // 设置会话
        req.session.userId = user.id;
        req.session.role = user.role;
        res.redirect('/');
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.render('publicPages/register', {
                alert: { type: 'warning', message: 'Username already exists' }
            });
        }
        if (err.name === 'SequelizeValidationError') {
            return res.render('publicPages/register', {
                alert: { type: 'warning', message: err.errors[0].message }
            });
        }
        logger.error('Signup error:', err);
        res.render('publicPages/register', {
            alert: { type: 'danger', message: `Registration failed: ${err.message}` }
        });
    }
});

module.exports = authController;