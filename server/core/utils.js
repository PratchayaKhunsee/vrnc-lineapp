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

module.exports = {
    hasEmptyField,
}