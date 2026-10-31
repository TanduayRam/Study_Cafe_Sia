const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'C:\\Users\\hi\\OneDrive - DEPED REGION 7-1\\Desktop\\SIA CAFE\\frontend')));


app.use('/api/auth', require('./routes/auth_routes'));
app.use('/api/users', require('./routes/user_routes'));

app.listen(3000, () => console.log('Running at http://localhost:3000'));