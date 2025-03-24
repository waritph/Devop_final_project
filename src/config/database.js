const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('game_shop', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

// 测试连接
(async () => {
    try {
        await sequelize.authenticate();
        console.log('MySQL connection successful');
    } catch (err) {
        console.error('MySQL connection failed:', err);
    }
})();

module.exports = sequelize;