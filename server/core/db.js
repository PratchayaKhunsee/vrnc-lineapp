const pg = require('pg');

// เอาออกหากใช้บนเว็บไซต์ที่มีระบบจัดการ env
require('dotenv').config();

/**
 * @typedef {Object} WaitingConnection
 * 
 * อินสแตนซ์สำหรับรอการเชื่อมต่อฐานข้อมูล จะถูกใช้งานเมื่อการเชื่อมต่อฐานข้อมูลก่อนหน้าทำงานเสร็จสิ้น
 * อินสแตนซ์นี้ใช้โมเดล node ของ linked list
 * 
 * @property {Function} release
 * @property {WaitingConnection} next
 */

let count = 0;
const maxCount = 10;
/** @type {WaitingConnection} */
let wait;

/**
 * เชื่อมต่อฐานข้อมูลและส่งอินสแตนซ์ที่เชื่อมต่อฐานข้อมูลแล้วผ่าน async callback จากนั้นการเชื่อมต่อนั้นจะถูกตัดอัตโนมัตเมื่อใช้งาน callback เสร็จ
 * @param {(client: import('pg').Client) => Promise} cb
 */
async function connect(cb) {
    let c = new pg.Client({
        connectionString: process.env.DEV_DATABASE_URL || process.env.DATABASE_URL,
    });

    if (count == maxCount) {
        await new Promise((resolve) => {
            /** @type {WaitingConnection} */
            const w = {
                release() {
                    if (wait === w) {
                        wait = w.next;
                    }
                    else {
                        let current = wait;
                        while (current) {
                            if (current.next === w) {
                                current.next = w.next;
                                break;
                            }
                            current = current.next;
                        }
                    }
                    resolve();
                }
            };

            if (!wait) {
                wait = w;
            } else {
                let current = wait; profile.userId
                while (current.next) current = current.next;
                current.next = w;
            }
        });
    }

    await c.connect();
    count++;

    let result = await cb(c);
    count--;
    await c.end();

    return result;
}

module.exports = { connect };