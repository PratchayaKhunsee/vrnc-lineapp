const https = require('https');
const crypto = require('crypto');
const cache = require('./cache');
const { URL } = require('url');

// เอาออกหากใช้บนเว็บไซต์ที่มีระบบจัดการ env
// require('dotenv').config();

/**
 * สร้างข้อความรูปแบบ URL-encoded จากอ็อปเจคต้นแบบ
 * @param {Object<string, string>} params
 */
function urlencoded_params(params) {
    return (new URLSearchParams(params)).toString();
}

/**
 * 
 * @typedef {Object} RequestResult
 * @property {Number} statusCode
 * @property {Object<string, string>?} headers
 * @property {*} body
 * 
 * เรียกใช้เว็บไซต์ด้วยลิงค์ URL
 * @param {import('https').RequestOptions} header 
 * @param {*} [body]
 * 
 * @returns {Promise<RequestResult>}
 * 
 */
function request(header, body) {
    return new Promise((resolve, reject) => {
        let r = {
            statusCode: 0,
            headers: null,
            body: null,
        };

        const req = https.request(header, (res) => {
            res.on('data', (chunk) => {
                r.body = chunk;
            });

            res.on('error', (err) => {
                reject(err);
            });

            res.on('close', () => {
                r.statusCode = res.statusCode;
                r.headers = res.headers;
                resolve(r);
            });
        });

        if (header.method != 'GET' && header.method != 'HEAD' && body !== undefined) {

            req.write(body);
        }

        req.end();
    });
}

/**
 * ฟังก์ชันนี้ไว้ใช้ล็อกอินเว็บผ่านแพล็ตฟอร์มของ Line ก่อนใช้งานจริง
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function login(req, res) {
    let url = new URL('https://access.line.me/oauth2/v2.1/authorize');
    let params = {
        'response_type': 'code',
        'client_id': process.env.LINE_CLIENT_ID,
        'redirect_uri': `${req.protocol}://${req.headers.host}/auth?redirect=${req.protocol}://${req.headers.host}${req.url}`,
        'state': crypto.randomUUID(),
        'scope': 'profile',
        'nonce': crypto.randomUUID()
    };

    for (let n in params) url.searchParams.set(n, params[n]);

    cache.set(`${process.env.LINE_STATE_KEYWORD}_${params.state}`, null);

    res.redirect(url.toString());
}

/**
 * ฟังก์ชันนี้ไว้ใช้สำหรับสร้างลิงค์ล็อกอินเว็บผ่านแพล็ตฟอร์มของ Line
 * @param {import('express').Request} req
 * @param {String} redirect
 */
function getLoginURL(req, redirect) {
    let url = new URL('https://access.line.me/oauth2/v2.1/authorize');
    let params = {
        'response_type': 'code',
        'client_id': process.env.LINE_CLIENT_ID,
        'redirect_uri': `${req.protocol}://${req.headers.host}/auth?redirect=${req.protocol}://${req.headers.host}${redirect}`,
        'state': crypto.randomUUID(),
        'scope': 'profile',
        'nonce': crypto.randomUUID()
    };

    for (let n in params) url.searchParams.set(n, params[n]);

    cache.set(`${process.env.LINE_STATE_KEYWORD}_${params.state}`, null);

    console.log(`${req.protocol}://${req.headers.host}/auth?redirect=${req.protocol}://${req.headers.host}${redirect}`);

    return url.toString();
}

/**
 * ฟังก์ชันสำหรับตรวจสอบว่าข้อมูล state ที่ Line ส่งมา ตรงกับที่ฝั่งเซิร์ฟเวอร์เราส่งหรือไม่
 * @param {String} state
 */
function verifyLoginState(state) {
    if (cache.has(`${process.env.LINE_STATE_KEYWORD}_${state}`)) {
        cache.remove(`${process.env.LINE_STATE_KEYWORD}_${state}`);
        return true;
    }

    return false;
}

/**
 * ฟังก์ชันนี้ไว้ใช้สำหรับร้องขอ access token จาก Line Login API.
 * 
 * @param {import('express').Request} req
 */
function requestAccessToken(req) {
    let url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
    /** @type {String} */
    let code = '';
    let otherParams = {};
    for (let o of url.searchParams.entries()) {
        switch (o[0]) {
            case 'code':
                code = o[1];
                break;
            case 'state':
            case 'friendship_status_changed':
            case 'liffClientId':
            case 'liffRedirectUri':
                break;
            default:
                otherParams[o[0]] = o[1];
                break;
        }
    }

    let params = Object.entries(otherParams).map(x => x[0] + '=' + x[1]).join('&');

    /**
     * @type {import('https').RequestOptions}
     */
    let header = {
        method: 'POST',
        hostname: 'api.line.me',
        path: '/oauth2/v2.1/token',
        port: 443,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    };

    return request(header, urlencoded_params({
        'grant_type': 'authorization_code',
        'code': code,
        'client_id': process.env.LINE_CLIENT_ID,
        'client_secret': process.env.LINE_CLIENT_SECRET,
        'redirect_uri': `${req.protocol}://${req.headers.host}/auth${params.length > 0 ? '?' + params : ''}`,
    }));
}

/**
 * ฟังก์ชันสำหรับตรวจสอบว่า access token ที่ได้รับ ถูกต้องหรือไม่
 * @param {String} token
 */
function verifyAccessToken(token) {

    /**
     * @type {import('https').RequestOptions}
     */
    let header = {
        method: 'GET',
        hostname: 'api.line.me',
        path: `/oauth2/v2.1/verify?access_token=${token}`,
        port: 443,
    };

    return request(header).then((response) => {
        if (response.body instanceof Buffer && response.statusCode == 200) {
            return true;
        }

        return false;
    });
}

/**
 * ฟังก์ชันนี้ไว้ใช้ล็อกอินเว็บผ่าน Line Login API
 * @this {import('express').Application}
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res
 * @param {()=>void} success  
 */
function authenticate(req, res, success) {
    let auth = typeof req.headers.authorization == 'string' ? req.headers.authorization.split(' ') : null;
    if (auth == null) {
        login(req, res);
        return;
    }

    success();
}

/**
 * @typedef {Object} LineUserProfile
 * @property {String} userId
 * @property {String} displayName
 * @property {String} pictureUrl
 * @property {String} statusMessage
 * 
 */
/**
 * ฟังก์ชันนี้ไว้ใช้สำหรับดึงข้อมูลบัญชีผู้ใช้ Line
 * 
 * @param {import('express').Request} req  
 * 
 * @returns {Promise<LineUserProfile>}
 */
function getUserProfile(req) {
    /**
     * @type {import('https').RequestOptions}
     */
    let header = {
        method: 'GET',
        hostname: 'api.line.me',
        path: '/v2/profile',
        port: 443,
        headers: {
            'authorization': req.headers.authorization,
        },
    };

    return request(header).then(response => {
        if (response.statusCode != 200) throw response;

        try {
            return JSON.parse(response.body);
        } catch (error) {
            throw response;
        }
    });
}

module.exports = {
    authenticate,
    verifyLoginState,
    verifyAccessToken,
    requestAccessToken,
    getLoginURL,
    getUserProfile,
};