const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { Game } = require('./Game');
const { User } = require('./User');

const CartModel = sequelize.define('Cart', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    gameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Game, key: 'id' }
    },
    qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    platform: {
        type: DataTypes.ENUM('pc', 'ps5', 'xbox', 'switch'),
        allowNull: false,
        defaultValue: 'pc'
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
    tableName: 'carts',
    timestamps: true
});

CartModel.belongsTo(User, { foreignKey: 'userId' });
CartModel.belongsTo(Game, { foreignKey: 'gameId' });

class Cart {
    constructor(cart = {}) {
        this.items = cart.items || {};
        this.totalQty = cart.totalQty || 0;
        this.totalPrice = cart.totalPrice || 0;
    }

    static async loadToSession(userId, session) {
        if (!userId) {
            session.cart = new Cart();
            return session.cart;
        }

        const cartItems = await CartModel.findAll({
            where: { userId },
            include: [{ model: Game }]
        });

        const cart = new Cart();
        cartItems.forEach(item => {
            const game = item.Game;
            cart.items[game.id] = {
                item: game,
                qty: item.qty,
                platform: item.platform
            };
            cart.totalQty += item.qty;
            const price = game.price_promotion !== null ? game.price_promotion : game.price;
            cart.totalPrice += price * item.qty;
        });

        session.cart = cart;
        return cart;
    }

    static async addItem(userId, game, qty, platform) {
        let cartItem = await CartModel.findOne({
            where: { userId, gameId: game.id }
        });

        if (cartItem) {
            cartItem.qty += qty;
            await cartItem.save();
        } else {
            await CartModel.create({
                userId,
                gameId: game.id,
                qty,
                platform
            });
        }
    }

    static async removeItem(userId, gameId) {
        await CartModel.destroy({
            where: { userId, gameId }
        });
    }

    add(game, qty = 1, platform = 'pc') {
        const id = game.id;
        if (!this.items[id]) {
            this.items[id] = { item: game, qty: 0, platform };
        }
        this.items[id].qty += qty;
        const price = game.price_promotion || game.price;
        this.totalQty += qty;
        this.totalPrice += qty * price;
    }

    remove(id) {
        if (this.items[id]) {
            const qty = this.items[id].qty;
            const price = this.items[id].item.price_promotion || this.items[id].item.price;
            this.totalQty -= qty;
            this.totalPrice -= qty * price;
            delete this.items[id];
        }
    }

    toArray() {
        return Object.values(this.items);
    }
}

module.exports = { Cart, CartModel };