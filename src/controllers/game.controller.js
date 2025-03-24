const express = require('express');
const { Game } = require('../models/Game');
const { User } = require('../models/User');
const logger = require('../utilities/logger');
const multer = require('multer');
const path = require('path');
const deleter = require('../utilities/deleter');
const { paginate } = require('../utilities/paginate');
const { Op } = require('sequelize');

const gameController = express.Router();

const storage = multer.diskStorage({
    destination: './public/uploads/games/',
    filename: (req, file, cb) => {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage }).single('image');

// 显示游戏列表
gameController.get('/', async (req, res) => {
    try {
        let { genre, page, title } = req.query;
        if (!page) page = 1;

        let filter = {};
        if (genre && genre !== 'any') filter.genre = genre;
        if (title && title !== 'undefined') {
            filter.title = { [Op.like]: `%${title}%` };
        }

        const games = await Game.findAll({
            where: filter,
            order: [['title', 'DESC']]
        });
        const paginateGames = paginate(games, page, 15);

        const user = await User.findByPk(req.session.userId);
        if (!user || user.role !== 'staff') throw new Error('Unauthorized');
        res.render('staffPages/manageGames', { user, data: paginateGames, genre: genre || 'any', page: parseInt(page), title: title || '' });
    } catch (err) {
        logger.error('Manage games error:', err);
        res.status(500).render('publicPages/error', { error: 'Server error' });
    }
});
// 显示添加/编辑游戏表单
gameController.get('/patch/:id?', async (req, res) => {
    try {
        const paramId = req.params.id;
        const gameDoc = paramId ? await Game.findByPk(paramId) : null;
        const user = await User.findByPk(req.session.userId);
        if (!user || user.role !== 'staff') throw new Error('Unauthorized');
        res.render('staffPages/gameForm', { gameDoc, user });
    } catch (err) {
        logger.error('Game form error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

// 添加游戏
gameController.post('/', upload, async (req, res) => {
    try {
        const user = await User.findByPk(req.session.userId);
        if (!user || user.role !== 'staff') throw new Error('Unauthorized');

        const { title, description, price, price_promotion, genre, platform, is_outofstock } = req.body;
        const image_path = req.file ? `/public/uploads/games/${req.file.filename}` : '/public/empty.png';

        await Game.create({
            title,
            description,
            price: Number(price),
            price_promotion: price_promotion ? Number(price_promotion) : null,
            image_path,
            genre,
            platform,
            is_outofstock: is_outofstock === 'true'
        });
        res.redirect('/staff/games');
    } catch (err) {
        logger.error('Add game error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

// 更新游戏
gameController.post('/update/:id', upload, async (req, res) => {
    try {
        const paramId = req.params.id;
        const user = await User.findByPk(req.session.userId);
        if (!user || user.role !== 'staff') throw new Error('Unauthorized');

        const { title, description, price, price_promotion, genre, platform, is_outofstock } = req.body;
        const game = await Game.findByPk(paramId);
        if (!game) throw new Error('Game not found');

        const updateData = {
            title: title || game.title,
            description: description || game.description,
            price: price ? Number(price) : game.price,
            price_promotion: price_promotion ? Number(price_promotion) : game.price_promotion,
            genre: genre || game.genre,
            platform: platform || game.platform,
            is_outofstock: is_outofstock === 'true' ? true : game.is_outofstock
        };

        if (req.file) {
            updateData.image_path = `/public/uploads/games/${req.file.filename}`;
            if (game.image_path && game.image_path !== '/public/empty.png') {
                await deleter(path.join(__dirname, '../..', game.image_path));
            }
        }

        await Game.update(updateData, { where: { id: paramId } });
        res.redirect('/staff/games');
    } catch (err) {
        logger.error('Update game error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});

gameController.delete('/delete/:id', async (req, res) => {
    try {
        const paramId = req.params.id;
        const user = await User.findByPk(req.session.userId);
        if (!user || user.role !== 'staff') throw new Error('Unauthorized');

        const gameDoc = await Game.findByPk(paramId);
        if (!gameDoc) throw new Error('Game not found');
        if (gameDoc.image_path && gameDoc.image_path !== '/public/empty.png') {
            await deleter(path.join(__dirname, '../..', gameDoc.image_path));
        }
        await Game.destroy({ where: { id: paramId } });
        const { title, genre, page } = req.body;
        const safeTitle = title && title !== 'undefined' ? title : '';
        res.redirect(`/staff/games?title=${encodeURIComponent(safeTitle)}&genre=${genre || 'any'}&page=${page || 1}`);
    } catch (err) {
        logger.error('Delete game error:', err);
        res.status(500).render('publicPages/error', { error: err.message });
    }
});
module.exports = gameController;