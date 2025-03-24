const express = require('express');
const session = require('express-session');
const path = require('path');
const router = require('./src/routes/router');
const userRouter = require('./src/routes/user.router');
const staffRouter = require('./src/routes/staff.router');
const logger = require('./src/utilities/logger');
const sequelize = require('./src/config/database');
const { Game } = require('./src/models/Game');
const { User } = require('./src/models/User');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override'); // 引入 method-override

const app = express();

// 中间件配置
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method')); // 添加 method-override 中间件
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.set('views', path.join(__dirname, 'src', 'views'));
app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/', router);
app.use('/user', userRouter);
app.use('/staff', staffRouter);

// 数据库同步和初始化
(async () => {
    try {
        await sequelize.sync({ alter: true });
        logger.info('Database synced');

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('password123', saltRounds);

        const userCount = await User.count();
        if (userCount === 0) {
            await User.bulkCreate([
                { username: 'admin', password: hashedPassword, role: 'staff' },
                { username: 'user', password: hashedPassword, role: 'user' }
            ]);
            logger.info('Initial users seeded');
        } else {
            logger.info('Users already exist, skipping seed');
        }

        const gameCount = await Game.count();
        if (gameCount === 0) {
            await Game.bulkCreate([
                { title: "Action Game 1", description: "Exciting action game", price: 599.00, price_promotion: 499.00, genre: "action", platform: "pc" },
                { title: "Adventure Game 1", description: "Epic adventure", price: 699.00, genre: "adventure", platform: "ps5" },
                { title: "RPG Game 1", description: "Deep role-playing", price: 799.00, genre: "rpg", platform: "xbox" },
                { title: "Strategy Game 1", description: "Tactical masterpiece", price: 499.00, genre: "strategy", platform: "switch" },
                { title: "Sports Game 1", description: "Fast-paced sports", price: 599.00, genre: "sports", platform: "pc" }
            ]);
            logger.info('Initial games seeded');
        } else {
            logger.info('Games already exist, skipping seed');
        }

        const port = 3000;
        app.listen(port, () => {
            logger.info(`Server is running on port ${port}`);
        });
    } catch (err) {
        logger.error('Error syncing database:', err);
    }
})();