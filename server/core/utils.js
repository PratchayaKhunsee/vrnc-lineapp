const { statSync } = require('fs');

/**
 * เช็คหาฟิลด์ที่ว่างตามรายชื่อ
 * @param {Object} obj 
 * @param {(String|Symbol)[]} keys 
 */
function hasEmptyField(obj, keys) {
    for (let n of keys) {
        if (obj[n] === null || obj[n] === undefined) {
            return true;
        }
    }

    return false;
}

var env;

/**
 * ตรวจหาไฟล์ .env ในโปรเจค
 * @returns {boolean}
 */
function hasEnvFile() {
    try {
        return typeof env == 'boolean' ? env : env = statSync(`${require.main.path}/.env`).isFile();
    } catch (error) {
        return false;
    }
}

module.exports = {
    hasEmptyField,
    hasEnvFile,
}