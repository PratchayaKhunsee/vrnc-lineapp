const { verifyAccessToken, getLoginURL } = require('../core/line-login-api');

/**
 * ลอจิกของการเข้าสู่ระบบ
 * @param {import('express').Request} req
 * @param {import('express').Response} res 
 */
async function login(req, res) {
    let auth = req.headers.authorization;

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

    // เช็คว่าได้รับโทเค่นล็อกอินที่ถูกต้องหรือไม่ หากถูกต้องให้ส่งหน้าเปล่า หากไม่ให้ส่งลิงค์ redirect และค่อยให้ไคล์เอ็นท์เข้าสู่ระบบด้วย Line อีกที
    if (typeof auth == 'string' && auth.length > 0 && await verifyAccessToken(auth.split(' ')[1])) {
        res.sendStatus(200);
    } else {
        res.status(401);

        if (body instanceof Buffer) {
            let params = new URLSearchParams(body.toString());

            console.log(getLoginURL(req, params.get('redirect')));

            res.write(new URLSearchParams({
                'redirect': getLoginURL(req, params.get('redirect'))
            }).toString());
        }

        res.end();
    }
}

module.exports = { login, };