const bcrypt = require('bcryptjs');


module.exports.encode = async (content) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedContent = await bcrypt.hash(content, salt)
        return hashedContent;
    } catch (err) {
        throw err;
    }
}

module.exports.validation = async (content, hashedContent) => {
    try {
        return await bcrypt.compare(content, hashedContent);
    } catch (err) {
        throw err;
    }
}