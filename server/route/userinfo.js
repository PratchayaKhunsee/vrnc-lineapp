const { createErrorMessage } = require('../core/error');
const { getUserProfile } = require('../core/line-login-api');
const { hasEmptyField } = require('../core/utils');
const database = require('../core/db');

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

        let save = await database.writeUserInfo(profile.userId, req.body);

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

        let userinfo = await database.readUserInfo(profile.userId);

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