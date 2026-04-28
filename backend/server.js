const express = require('express');
const cors = require('cors');
const path = require('path');

global.appRoot = path.resolve(__dirname);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', function (req, res) {
    res.send('DineBot API live');
});

require('./app/routes/chat.routes.js')(app);

app.listen(port, '0.0.0.0', () => {
    console.log(`DineBot backend running at http://localhost:${port}`);
});
