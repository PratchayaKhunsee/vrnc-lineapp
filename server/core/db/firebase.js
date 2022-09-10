
const { initializeApp } = require('firebase/app');
const {
    getDatabase,
    ref,
    get,
    push,
    update: updateDatabase,
    query,
    equalTo,
    set,
    orderByPriority,
    orderByKey,
} = require('firebase/database');
const { getAuth, signInWithCustomToken } = require('firebase/auth');
const admin = require('firebase-admin/app');
const adminAuth = require('firebase-admin/auth');

// เอาออกหากใช้บนเว็บไซต์ที่มีระบบจัดการ env
// require('dotenv').config();

const app = initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    appId: process.env.FIREBASE_APP_ID,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const adminApp = admin.initializeApp({
    credential: admin.cert(require(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
    projectId: process.env.FIREBASE_PROJECT_ID,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});

/** @type {import('firebase/auth').UserCredential} */
var credential;
/** @type {Function[]} */
const locks = [];
function pushPromiseLock() {
    return new Promise((resolve, _) => { locks.push(resolve); })
}

(async () => {
    const token = await adminAuth.getAuth(adminApp).createCustomToken(process.env.FIREBASE_DATABASE_ALLOWED_USER_UID)
    credential = await signInWithCustomToken(getAuth(app), token);

    for (var f of locks) f();
})();
class Match {
    /**
     * @param {String} key 
     * @param {*} value 
     */
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
}

/**
 * 
 * @param {String} refPath 
 * @param {...Match} matches
 * 
 * @returns {Promise<Object|List<Object>|null>}
 */
async function select(refPath, ...matches) {
    if (!credential) await pushPromiseLock();
    const db = getDatabase(app);

    if (matches.length == 0) return await get(ref(db, refPath)).then(snapshot => snapshot.toJSON());

    const result = [];

    for (let m of matches) {
        const q = query(query(ref(db, refPath), orderByKey()), equalTo(m.value));
        console.log(q.toJSON(), m.key, m.value);
        let items = (await get(q)).val();

        Array.prototype.push.apply(result, items);
    }

    return result;
}

/**
 * 
 * @param {String} refPath 
 * @param {*} value 
 * @param {Boolean} useOverwriteMethod
 */
async function insert(refPath, value, useOverwriteMethod = false) {
    if (!credential) await pushPromiseLock();
    const db = getDatabase(app);

    if (useOverwriteMethod) {
        await set(ref(db, refPath), value);
        return;
    }
    return await push(ref(db, refPath), value).then(snapshot => snapshot.key);
}

/**
 * 
 * @param {String} refPath 
 * @param {*} values 
 */
async function update(refPath, values) {
    if (!credential) await pushPromiseLock();
    const db = getDatabase(app);

    return await updateDatabase(ref(db, refPath), values);
}

module.exports = { insert, select, update, Match, };