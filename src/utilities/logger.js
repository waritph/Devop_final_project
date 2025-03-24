const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({
            filename: 'log/log.log',
            level: 'debug'
        }),
        new transports.File({
            filename: 'log/errors.log',
            level: 'error'
        })
    ]
});

module.exports = logger;