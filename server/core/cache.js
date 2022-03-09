const NodeCache = require('node-cache');

const cache = new NodeCache();

module.exports = {
    /**
     * บันทึกข้อมูลลงแคช โดยมีอายุข้อมูลที่ 120 วินาที
     * @param {String} key 
     * @param {*} value 
     */
    set(key, value){
        return cache.set(key, value, 120);
    },
    /**
     * ดึงข้อมูลจากแคช
     * @param {String} key  
     */
    get(key){
        return cache.get(key);
    },
    /**
     * เช็กว่ามีตำแหน่งคีย์ที่ป้อนได้ถูกใช้งานแล้วหรือไม่
     * @param {String} key 
     * @returns 
     */
    has(key){
        return cache.has(key);
    },
    /**
     * ลบแคชจาตำแหน่งคีย์ที่ระบุ
     * @param {String} key 
     * @returns
     */
    remove(key){
        return cache.del(key);
    }
}