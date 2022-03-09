const cache = require('../core/cache');

/**
 * ลอจิกสำหรับหน้ารับ token จากเว็บไซต์
 * @param {import('express').Request} req
 * @param {import('express').Response} res 
 */
async function token(req, res) {
    let body = await new Promise((resolve, reject) => {
        let data;
        req.on('data', (chunk) => {
            data = chunk;
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.on('close', () => {
            resolve(data);
        });
    });

    if (body instanceof Buffer) {
        let params = new URLSearchParams(body.toString());

        let uuid = params.get('id');

        let authorization = cache.get(`${process.env.APP_ACCESS_KEYWORD}_${uuid}`);

        if (typeof authorization == 'string') {
            res.write(authorization);
        }
    }

    res.end();
}

module.exports = { token, };