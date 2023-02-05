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

            p.uid = await firebase.insert(`userinfo/${uid}`, p, true);

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
 * @param {Object} data
 * @param {String} data.firstname
 * @param {String} data.lastname
 * @param {Number} data.sex
 * @param {String} data.birthdate
 * @param {String} data.address
 * @param {String} data.tel 
 * @returns {Promise<void>}
 */
async function writeUserInfo(uid, data) {
    const p = {
        firstname: data.firstname,
        lastname: data.lastname,
        sex: data.sex,
        birthdate: data.birthdate,
        address: data.address,
        tel: data.tel,
    };
    if (typeof p.firstname != 'string') delete p.firstname;
    if (typeof p.lastname != 'string') delete p.lastname;
    if (p.sex !== 0 && p.sex !== 1) delete p.sex;
    if (typeof p.birthdate != 'string') delete p.birthdate;
    if (typeof p.address != 'string') delete p.address;
    if (typeof p.tel != 'string') delete p.tel;

    if (DATABASE_TYPE == "firebase") {
        await firebase.update(`userinfo/${uid}`, p);
        return;
    }

    await pg.connect(async client => {
        let i = 1;
        let result = await client.query({
            text: `UPDATE userinfo SET ${Object.keys(values).map((x) => `${x} = $${i++}`).join(',')} WHERE uid = $${i}`,
            values: [...Object.values(values), uid],
        });

        if (result.rowCount != 1) throw result;
    });
}

/**
 * 
 * @param {String} uid
 * @returns {Promise<Vaccination>} 
 */
async function createEmptyVaccination(uid) {
    if (DATABASE_TYPE == "firebase") {
        /** @type {Vaccination} */
        let result = {
            uid,
            vaccine_name: "",
            vaccine_brand: "",
            vaccination_date: "",
            vaccination_address: "",
        };

        result.id = await firebase.insert(`vaccination`, result);

        if (typeof result.id !== 'string') throw result.id;

        return result;
    }

    return await pg.connect(async client => {
        let user = await client.query({
            text: `SELECT * FROM userinfo WHERE uid = $1`,
            values: [uid],
        });

        if (user.rows.length != 1) throw user;

        let result = await client.query({
            text: `INSERT INTO vaccination(uid) VALUES($1) RETURNING *`,
            values: [uid],
        });

        if (result.rows.length != 1) throw result;

        return result.rows[0];
    });
}

/**
 * 
 * @param {String} uid 
 * @param {String} vid 
 * @returns {Promise<Vaccination>}
 */
async function readVaccination(uid, vid) {
    if (DATABASE_TYPE == "firebase") {
        let result = await firebase.select(`vaccination/${vid}`);

        if (result === null) throw result;

        return result;
    }

    return await pg.connect(async client => {

        let result = await client.query({
            text: `SELECT id,vaccine_name,vaccine_name,vaccination_date,vaccination_address,vaccine_brand FROM vaccination WHERE uid = $1 AND id = $2`,
            values: [uid, id],
        });

        if (result.rows.length != 1) throw result;

        return result.rows[0];
    });
}

/**
 * 
 * @param {String} uid 
 * @param {String} id 
 * @param {Object} data
 * @param {String} data.vaccine_name
 * @param {String} data.vaccine_brand
 * @param {String} data.vaccination_date
 * @param {String} data.vaccination_address
 * 
 * @returns {Promise<void>} 
 */
async function writeVaccination(uid, vid, data) {
    const p = {
        vaccine_name: data.vaccine_name,
        vaccine_brand: data.vaccine_brand,
        vaccination_date: data.vaccination_date,
        vaccination_address: data.vaccination_address,
    };
    if (typeof p.vaccine_name != 'string') delete p.vaccine_name;
    if (typeof p.vaccine_brand != 'string') delete p.vaccine_brand;
    if (typeof p.vaccination_date != 'string') delete p.vaccination_date;
    if (typeof p.vaccination_address != 'string') delete p.vaccination_address;

    if (DATABASE_TYPE == "firebase") {
        let o = await firebase.select(`vaccination/${vid}`);

        if (o === null || o.uid != uid) throw o;

        await firebase.update(`vaccination/${vid}`, p);
        return;
    }

    await pg.connect(async client => {
        let i = 1;
        let result = await client.query({
            text: `UPDATE vaccination SET ${Object.keys(data).map((x) => `${x} = $${i++}`).join(',')} WHERE uid = $${i++} AND id = $${i}`,
            values: [...Object.values(data), uid, vid],
        });

        if (result.rowCount != 1) throw result;
    });
}

/**
 * 
 * @param {String} uid 
 * @returns {Promise<Vaccination[]>}
 */
async function listBrieflyVaccination(uid) {
    if (DATABASE_TYPE == "firebase") {
        return await firebase.select('vaccination', new firebase.Match('uid', uid));
    }

    return await pg.connect(async client => {
        let user = await client.query({
            text: `SELECT * FROM userinfo WHERE uid = $1`,
            values: [uid],
        });

        if (user.rows.length != 1) throw user;

        let result = await client.query({
            text: `SELECT * FROM vaccination WHERE uid = $1`,
            values: [uid],
        });

        return result.rows;
    });
}

/**
 * @param {String} uid
 * @param {String} vid
 * @returns {Promise<boolean>} 
 */
async function removeVaccination(uid, vid) {
    if (DATABASE_TYPE == "firebase") {
        return await firebase.remove(`vaccination/${vid}`, uid);
    }


    return await pg.connect(async client => {
        const result = await client.query({
            text: `DELETE FROM vaccination WHERE vid = $1 AND uid = $2`,
            values: [vid, uid],
        });

        if (result.rowCount != 1) return false;

        return true;
    });
}

module.exports = {
    readUserInfo,
    writeUserInfo,
    createEmptyVaccination,
    readVaccination,
    writeVaccination,
    listBrieflyVaccination,
    removeVaccination,
};