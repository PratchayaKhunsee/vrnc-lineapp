const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { auth } = require('./auth');
const { login } = require('./login');
const { token } = require('./token');
const { saveUserInfo, getUserInfo } = require('./userinfo');
const { saveVaccination, getVaccination, createEmptyVaccination } = require('./vaccination');

/**
 * ทำ URL ให้กับเว็บไซต์ และออกแบบการทำงานบนเซิร์ฟเวอร์
 * @param {import('express').Express} app
 */
function route(app) {
    app.use(cors(function (req, cb) {
        // ทำให้แอปฯ นี้สามารถใช้งานได้เฉพาะภายในโดเมนของแอปฯ นี้เท่านั้น
        cb(null, {
            origin: `${req.protocol}://${req.header('host')}`,
        });
    }), (req, res, next) => {
        /**
         * ทำการหาไฟล์ในโฟลเดอร์ client เพื่อแสดงผลหน้าจอกับผู้ใช้ หากไม่พบ อนุญาตให้แอปฯ ใช้ลอจิคถัดไป
         * @type {String} 
         **/
        let fileFound = (function find(dirpath) {
            let dir = fs.opendirSync(dirpath);
            let dirent = dir.readSync();

            while (dirent) {
                if (dirent.isDirectory()) {
                    let found = find(dirpath + '/' + dirent.name);
                    if (found) {
                        dir.closeSync();
                        return found;
                    }
                } else {
                    let realfilepath = dirpath + '/' + dirent.name
                    let filepath = realfilepath.replace(/^([A-Za-z0-9]|\.|-|_|#|\|)+/g, '');
                    let path = req.path;

                    if (filepath == path || filepath.match(new RegExp(path + '(\.html|\.htm)'))) {
                        dir.closeSync();
                        return realfilepath;
                    }
                }

                dirent = dir.readSync();
            }

            dir.closeSync();
            return null;

        })('client');


        if (fileFound) {
            res.sendFile(process.env.PWD + '/' + fileFound);
        } else {
            next();
        }
    });

    app.get('/auth', auth);
    app.post('/login', login);
    app.post('/token/get', token);
    app.post('/userinfo/save', express.json(), saveUserInfo);
    app.post('/vaccination/save', express.json(), saveVaccination);
    app.get('/userinfo/retrieve', getUserInfo);
    app.post('/vaccination/retrieve', express.json(), getVaccination);
    app.post('/vaccination/create/confirm', createEmptyVaccination);
}

module.exports = route;