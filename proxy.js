const express = require('express')
const cors_proxy = require('cors-anywhere');

const app = express();
app.use(express.json());

var host = process.env.HOST || '0.0.0.0';
var port = process.env.PORT || 8080;

cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, function() {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
});
