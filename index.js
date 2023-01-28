const express = require('express');
const { route } = require('./server');
const app = express();
const { hasEnvFile } = require('./server/core/utils');

if (hasEnvFile()) require('dotenv').config();

route(app);

const server = app.listen(process.env.PORT ?? 8000);
server.addListener('listening', () => {
    const address = server.address();
    console.log(`Listening at http://127.0.0.1:${address.port}`);
});
