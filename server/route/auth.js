const crypto = require('crypto');
const cache = require('../core/cache');

const {
    verifyLoginState,
    requestAccessToken,
} = require('../core/line-login-api');

/**
 * ลอจิคสำหรับร้องของ access token จาก Line API
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function auth(req, res) {
    if (verifyLoginState(new URL(
        req.url,
        `${process.env.PROTOCOL || req.protocol}://${req.headers.host}`
    ).searchParams.get('state'))) {
        try {
            let response = await requestAccessToken(req, res);
            if (response.body instanceof Buffer) {
                let result = JSON.parse(response.body.toString());
                let url = new URL(req.url, `${process.env.PROTOCOL || req.protocol}://${req.headers.host}`);

                if (result.error) return;

                let uuid = crypto.randomUUID();
                let tokenUrl = new URL(`${process.env.PROTOCOL || req.protocol}://${req.headers.host}/token`);

                cache.set(
                    `${process.env.APP_ACCESS_KEYWORD}_${uuid}`,
                    `${result.token_type} ${result.access_token}`
                );

                tokenUrl.searchParams.set('id', uuid);
                tokenUrl.searchParams.set('redirect', url.searchParams.get('redirect'));

                res.redirect(tokenUrl.toString());
            }
        } catch (error) {

        }
    }

    res.end();
}

module.exports = { auth, };