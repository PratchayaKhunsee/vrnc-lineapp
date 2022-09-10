/**
 * @typedef {Object} UserInfo
 * @property {String} uid
 * @property {String} firstname
 * @property {String} lastname
 * @property {String} address
 * @property {Number} sex
 * @property {String} birthdate
 * @property {String} tel
 * 
 * @typedef {Object} Vaccination
 * @property {String} id
 * @property {String} uid
 * @property {String} vaccine_name
 * @property {String} vaccine_brand
 * @property {String} vaccination_date
 * @property {String} vaccination_address
 */

/** @namespace */

const pg = require('./postgres');
const firebase = require('./firebase');

const DATABASE_TYPE = process.env.DATABASE_TYPE;

/**
 * 
 * @param {String} uid 
 * @returns {Promise<UserInfo>}
 */
async function readUserInfo(uid) {
    if (DATABASE_TYPE == "firebase") {
        let result = await firebase.select(`userinfo/${uid}`);

        if (result === null) {
            /** @type {UserInfo} */
            const p = {
                firstname: "",
                lastname: "",
                address: "",
                sex: 0,
                birthdate: "",
                tel: "",
            };

            p.uid = await firebase.insert(`userinfo`, p, true);

            return p;
        }

        return { ...result, uid, };
    }

    return await pg.connect(async client => {
        let result = await client.query({
            text: `SELECT * FROM userinfo WHERE uid = $1`,
            values: [uid],
        });

        switch (result.rows.length) {
            case 0:
                let c = await client.query({
                    text: `INSERT INTO userinfo(uid) VALUES($1) RETURNING *`,
                    values: [uid],
                });
                if (c.rowCount != 1) throw c;
                return c.rows[0];
            case 1:
                return result.rows[0];
            default:
                throw result;
        }
    });
}

/**
 * 
 * @param {String} uid 
 * @param {UserInfo} values 
 * @returns {void}
 */
function writeUserInfo(uid, values) {
    if (DATABASE_TYPE == "firebase") {
        const p = { ...values };
        if (typeof values.firstname !== 'string') delete p.firstname;
        if (typeof values.lastname !== 'string') delete p.lastname;
        if (values.sex !== 0 && values.sex !== 1) delete p.sex;
        if (typeof values.birthdate !== 'string') delete p.birthdate;
        if (typeof values.address !== 'string') delete p.address;
        if (typeof values.tel !== 'string') delete p.tel;

        await firebase.update(`userinfo/${uid}`, p);
    }

    return await connect(async client => {
        let i = 1;
        let result = await client.query({
            text: `UPDATE userinfo SET ${Object.keys(values).map((x) => `${x} = $${i++}`).join(',')} WHERE uid = $${i}`,
            values: [...Object.values(values), uid],
        });

        if (result.rowCount != 1) throw result;
    });

}

function readVaccination(uid, id) {

}

function writeVaccination(uid, id, {
    vaccine_name,
    vaccine_brand,
    vaccination_date,
    vaccination_address,
}) {

}

function listBrieflyVaccination(uid) { }

module.exports = {
    readUserInfo,
    writeUserInfo,
    readVaccination,
    writeVaccination,
    listBrieflyVaccination,
};