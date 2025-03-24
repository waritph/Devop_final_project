const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Game = sequelize.define('Game', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    price_promotion: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: null
    },
    image_path: {
        type: DataTypes.STRING,
        defaultValue: '/public/empty.png'
    },
    genre: {
        type: DataTypes.ENUM('action', 'adventure', 'rpg', 'strategy', 'sports'),
        allowNull: false
    },
    platform: {
        type: DataTypes.ENUM('pc', 'ps5', 'xbox', 'switch'),
        defaultValue: 'pc'
    },
    releaseDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    rating: {
        type: DataTypes.ENUM('E', 'T', 'M'),
        defaultValue: 'E'
    },
    is_outofstock: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'games',
    timestamps: true
});

module.exports = { Game };