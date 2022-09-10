const { createErrorMessage } = require('../core/error');
const { getUserProfile } = require('../core/line-login-api');
const { hasEmptyField } = require('../core/utils');
const database = require('../core/db');


/**
 * ลอจิกสำหรับบันทึกข้อมูลการรับวัคซีน
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function saveVaccination(req, res) {
    if (hasEmptyField(req.body, ['vaccine_name', 'vaccine_brand', 'vaccination_date', 'vaccination_address', 'id', 'uid'])) {
        res.json(createErrorMessage('empty_field_detected'));
        return;
    }

    try {
        let profile = await getUserProfile(req);

        await database.writeVaccination(profile.userId, req.body.id, {
            vaccine_name: req.body.vaccine_name,
            vaccine_brand: req.body.vaccine_brand,
            vaccination_date: req.body.vaccination_date,
            vaccination_address: req.body.vaccination_address,
        });

        res.json({ success: true });

    } catch (error) {
        res.status(400).json({ success: false });
    }
}

/**
 * ลอจิกสำหรับอ่านข้อมูลการรับวัคซีน
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getVaccination(req, res) {
    if (hasEmptyField(req.body, ['id'])) {
        res.json(createErrorMessage("required_field_missing"));
        return;
    }

    try {
        let profile = await getUserProfile(req);

        let vaccination = await database.readVaccination(profile.userId, req.body.id);

        res.json(vaccination);

    } catch (err) {
        res.status(401).send({ success: false });
    }
}

/**
 * ลอจิกสำหรับสร้างข้อมูลการรับวัคซีน
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function createEmptyVaccination(req, res) {
    try {
        let profile = await getUserProfile(req);

        let create = await database.createEmptyVaccination(profile.userId);

        res.write(new URLSearchParams({
            redirect: `${process.env.PROTOCOL || req.protocol}://${req.headers.host}/vaccination?id=${create.id}`
        }).toString());
        res.end();

    } catch (error) {
        res.sendStatus(400);
    }
}

/**
 * ลอจิกสำหรับลิสต์ข้อมูลการรับวัคซีนเบื้องต้น
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function listBrieflyVaccination(req, res) {

    try {

        let profile = await getUserProfile(req);

        let list = await database.listBrieflyVaccination(profile.userId);

        res.json(list);

    } catch (error) {
        res.status(403).json(null);
    }
}

module.exports = {
    saveVaccination,
    getVaccination,
    createEmptyVaccination,
    listBrieflyVaccination,
};