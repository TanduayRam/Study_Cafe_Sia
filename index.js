const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));


app.use('/api/auth', require('./routes/auth_routes'));
app.use('/api/users', require('./routes/user_routes'));

app.use('/api/study-zones', require('./routes/studyZoneRoutes'));
app.use('/api/seats', require('./routes/seatRoutes'));
app.use('/api/menu-items', require('./routes/menuItemRoutes'));

app.get('/test', (req, res) => {
    res.send('Express is working!');
});

console.log('Study Zone routes loaded');

app.listen(3000, () => console.log('Running at http://localhost:3000'));