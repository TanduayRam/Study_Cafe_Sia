
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

app.use(express.static(path.join(__dirname, 'C:\\Users\\hi\\OneDrive - DEPED REGION 7-1\\Desktop\\SIA CAFE\\frontend')));

app.use('/api/auth', require('./routes/auth_routes'));
app.use('/api/users', require('./routes/user_routes'));

app.use('/api/v1/dashboard', require('./routes/dashboard_routes'));
app.use('/api/v1/reports', require('./routes/report_routes'));
app.use('/api/v1/feedback-reviews', require('./routes/feedback_review_routes'));
app.use('/api/v1/report-snapshots', require('./routes/report_snapshot_routes'));
app.use('/api/study-zones', require('./routes/studyZoneRoutes'));
app.use('/api/seats', require('./routes/seatRoutes'));
app.use('/api/menu-items', require('./routes/menuItemRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

app.get('/test', (req, res) => {
    res.send('Express is working!');
});

console.log('Study Zone routes loaded');

app.listen(3000, () => console.log('Running at http://localhost:3000'));
