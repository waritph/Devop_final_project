const fs = require('fs');
const logger = require('./logger');

module.exports = async function deleteFile(path) {
    logger.info(`Delete ${path}`);

    fs.unlink(path, (err) => {
        if (err) {
            logger.error(err);
            throw err;
        }
    });

} 