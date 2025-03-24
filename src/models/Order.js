const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { Game } = require('./Game');
const { User } = require('./User');

const Order = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    owner_id: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
    destination: { type: DataTypes.STRING, allowNull: false },
    shipping_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    product_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    note: { type: DataTypes.TEXT, defaultValue: '' },
    firstname: { type: DataTypes.STRING, allowNull: false },
    lastname: { type: DataTypes.STRING, allowNull: false },
    telephone: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered'), defaultValue: 'pending' },
    paymentProof: { type: DataTypes.STRING, defaultValue: null }
}, { tableName: 'orders', timestamps: true });

const OrderItem = sequelize.define('OrderItem', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    order_id: { type: DataTypes.INTEGER, references: { model: Order, key: 'id' } },
    item_id: { type: DataTypes.INTEGER, references: { model: Game, key: 'id' } },
    qty: { type: DataTypes.INTEGER, allowNull: false },
    platform: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'order_items', timestamps: false });

// 定义关联
Order.belongsTo(User, { foreignKey: 'owner_id', as: 'User' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'records' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
OrderItem.belongsTo(Game, { foreignKey: 'item_id', as: 'item' });

module.exports = { Order, OrderItem };