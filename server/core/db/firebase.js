
const { initializeApp } = require('firebase/app');
const {
    getDatabase,
    ref,
    get,
    push,
    update: updateDatabase,
    query,
    set,
    orderByKey,
    remove: removeByRef,
} = require('firebase/database');
const { getAuth, signInWithCustomToken } = require('firebase/auth');
const admin = require('firebase-admin/app');
const adminAuth = require('firebase-admin/auth');
const { hasEnvFile } = require('../utils');

if (hasEnvFile()) require('dotenv').config();

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

    if (matches.length == 0) return await get(ref(db, refPath)).then(snapshot => snapshot.val());

    const list = [];

    (await get(query(ref(db, refPath), orderByKey()))).forEach(snapshot => {
        for (let m of matches) {
            let instance = snapshot.val();

            if (instance[m.key] !== m.value) continue;
            list.push({ key: snapshot.key, value: instance });
            return;
        }
    });

    return list;
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

    (await get(query(ref(db, refPath), orderByKey()))).forEach(snapshot => {
        
    });

    return await updateDatabase(ref(db, refPath), values);
}

/**
 * 
 * @param {String} refPath 
 * @param {String} uid
 */
async function remove(refPath, uid) {
    if (!credential) await pushPromiseLock();
    const db = getDatabase(app);

    const result = (await get(ref(db, refPath))).val();

    if(!result || result.uid !== uid) return false;

    return await removeByRef(ref(db, refPath)).then(() => true).catch(() => false);
}

module.exports = { insert, select, update, remove, Match, };