require('./core/utils').initDotEnv();

const express = require('express');
// const fs = require('fs');
const { auth } = require('./route/auth');
const { login } = require('./route/login');
const { token } = require('./route/token');
const { saveUserInfo, getUserInfo } = require('./route/userinfo');
const { saveVaccination, getVaccination, createEmptyVaccination, listBrieflyVaccination, removeVaccination } = require('./route/vaccination');

/**
 * ทำ URL ให้กับเว็บไซต์ และออกแบบการทำงานบนเซิร์ฟเวอร์
 * @param {import('express').Express} app
 */
function route(app) {
    app.use(express.static('client', { extensions: ['html', 'htm'] }));
    app.get('/auth', auth);
    app.post('/login', login);
    app.post('/token/get', token);
    app.post('/userinfo/save', express.json(), saveUserInfo);
    app.post('/vaccination/save', express.json(), saveVaccination);
    app.get('/userinfo/retrieve', getUserInfo);
    app.post('/vaccination/retrieve', express.json(), getVaccination);
    app.get('/vaccination/create/confirm', createEmptyVaccination);
    app.get('/vaccination/list', listBrieflyVaccination);
    app.post('/vaccination/remove', express.json(), removeVaccination);
    app.use((req, res) => res.redirect('/404'));
}

module.exports = { route };