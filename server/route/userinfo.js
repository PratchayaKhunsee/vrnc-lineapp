const { createErrorMessage } = require('../core/error');
const { getUserProfile } = require('../core/line-login-api');
const { hasEmptyField } = require('../core/utils');
const { connect } = require('../core/db');

/**
 * ลอจิกสำหรับหน้าเก็บข้อมูลผู้ใช้
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function saveUserInfo(req, res) {
    if (hasEmptyField(req.body, ['firstname', 'lastname', 'address', 'sex', 'birthdate', 'tel'])) {
        res.json(createErrorMessage('empty_field_detected'));
        return;
    }

    try {

        let profile = await getUserProfile(req);

        let save = await connect(async client => {
            let i = 1;
            let result = await client.query({
                text: `UPDATE userinfo SET ${Object.keys(req.body).map((x) => `${x} = $${i++}`).join(',')} WHERE uid = $${i}`,
                values: [...Object.values(req.body), profile.userId],
            });

            if (result.rowCount != 1) throw result;

            return { success: true };
        });

        res.json(save);

    } catch (error) {
        res.status(401).json({ success: false });
    }
}

/**
 * ลอจิกสำหรับหน้าเรียกข้อมูลผู้ใช้
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getUserInfo(req, res) {
    try {
        let profile = await getUserProfile(req);

        let userinfo = await connect(async client => {

            let result = await client.query({
                text: `SELECT * FROM userinfo WHERE uid = $1`,
                values: [profile.userId],
            });

            switch (result.rows.length) {
                case 0:
                    let c = await client.query({
                        text: `INSERT INTO userinfo(uid) VALUES($1) RETURNING *`,
                        values: [profile.userId],
                    });
                    if (c.rowCount != 1) throw c;
                    return c.rows[0];
                case 1:
                    return result.rows[0];
                default:
                    throw result;
            }
        });

        res.json(userinfo);

    } catch (err) {
        console.error(err);
        res.sendStatus(403);
    }
}

module.exports = {
    saveUserInfo,
    getUserInfo,
};