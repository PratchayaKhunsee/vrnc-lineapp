const { createErrorMessage } = require('../core/error');
const { getUserProfile, verifyAccessToken, getLoginURL } = require('../core/line-login-api');
const { hasEmptyField } = require('../core/utils');
const { connect } = require('../core/db');


/**
 * ลอจิกสำหรับบันทึกข้อมูลการรับวัคซีน
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function saveVaccination(req, res) {
    if (hasEmptyField(req.body, ['vaccine_name', 'vaccine_brand', 'vaccination_date', 'vaccination_address', 'id'])) {
        res.json(createErrorMessage('empty_field_detected'));
        return;
    }

    try {
        let profile = await getUserProfile(req);

        let id = Number(req.body.id);

        delete req.body.id;

        let save = await connect(async client => {
            let i = 1;
            let result = await client.query({
                text: `UPDATE vaccination SET ${Object.keys(req.body).map((x) => `${x} = $${i++}`).join(',')} WHERE uid = $${i++} AND id = $${i}`,
                values: [...Object.values(req.body), profile.userId, id],
            });

            if (result.rowCount != 1) throw result;

            return { success: true };
        });

        res.json(save);

    } catch (error) {
        res.json({ success: false });
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

    /** @type {Number} */
    let id = Number(req.body.id);



    try {
        let profile = await getUserProfile(req);

        let vaccination = await connect(async client => {

            let result = await client.query({
                text: `SELECT id,vaccine_name,vaccine_name,vaccination_date,vaccination_address,vaccine_brand FROM vaccination WHERE uid = $1 AND id = $2`,
                values: [profile.userId, id],
            });

            if (result.rows.length != 1) throw result;

            return result.rows[0];
        });

        res.json(vaccination);

    } catch (err) {
        res.sendStatus(401);
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

        let create = await connect(async client => {
            try {
                await client.query('BEGIN');

                let result = await client.query({
                    text: `INSERT INTO vaccination(uid) VALUES($1) RETURNING *`,
                    values: [profile.userId],
                });

                if (result.rows.length != 1) throw result;

                await client.query('COMMIT');

                return result.rows[0];
            } catch (err) {
                await client.query('ROLLBACK');
            }


        });

        res.write(new URLSearchParams({
            redirect: `${req.protocol}://${req.headers.host}/vaccination?id=${create.id}`
        }).toString());
        res.end();

    } catch (error) {
        res.sendStatus(403);
    }
}

module.exports = {
    saveVaccination,
    getVaccination,
    createEmptyVaccination,
};