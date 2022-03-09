const express = require('express');
const { route } = require('./server');
const app = express();

// เอาออกหากใช้บนเว็บไซต์ที่มีระบบจัดการ env
// require('dotenv').config();

route(app);

const server = app.listen(process.env.PORT);
server.addListener('listening', () => {
    const address = server.address();
    console.log(`Listening at http://127.0.0.1:${address.port}`);
});
