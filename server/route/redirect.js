const { verifyAccessToken } = require('../core/line-login-api');
const cache = require('../core/cache');

/**
 * ลอจิกของหน้า redirect
 * @param {import('express').Request} req
 * @param {import('express').Response} res 
 */
function redirect(req, res) {
    let url = new URL(req.url, `${req.protocol}://${req.headers.host}`);
    let uuid = url.searchParams.get('id');

    let authorization = cache.get(`${process.env.APP_ACCESS_KEYWORD}_${uuid}`);

    if(typeof authorization == 'string'){
        verifyAccessToken(authorization.split(' ')[0]).then(x => {
            if(x);
        }).finally(() => {
            res.end();
        });
    }
}

module.exports = { redirect, };