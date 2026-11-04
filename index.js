
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'C:\\Users\\hi\\OneDrive - DEPED REGION 7-1\\Desktop\\SIA CAFE\\frontend')));
app.use(express.static(path.join(__dirname, 'frontend')));

// Authentication and Membership Routes
app.use('/api/auth', require('./routes/auth_routes'));
app.use('/api/users', require('./routes/user_routes'));
app.use('/api/session-logs', require('./routes/session_logs_routes'));
app.use('/api/alerts', require('./routes/alerts_routes'));
app.use('/api/engine', require('./routes/engine_routes'));
app.use('/api/audit-logs', require('./routes/audit_logs_routes'));
app.use('/api/no-show', require('./routes/no_show_routes'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'user.html'));
});

app.listen(3000, () => {
    console.log('Running at http://localhost:3000');
});

app.use('/api/v1/dashboard', require('./routes/dashboard_routes'));
app.use('/api/v1/reports', require('./routes/report_routes'));
app.use('/api/v1/feedback-reviews', require('./routes/feedback_review_routes'));
app.use('/api/v1/report-snapshots', require('./routes/report_snapshot_routes'));
app.use('/api/pass-packages', require('./routes/pass_package_routes'));
app.use('/api/member-passes', require('./routes/member_pass_routes'));
app.use('/api/payments', require('./routes/payment_routes'));
app.use('/api/billing', require('./routes/billing_routes'));
app.use('/api/billing', require('./routes/no_show_routes'));
app.use('/api/reports', require('./routes/member_pass_report_routes'));
app.use('/api/reports', require('./routes/reservation_order_report_routes'));
app.use('/api/checkout', require('./routes/checkout_routes'));

// Study Café Routes
app.use('/api/study-zones', require('./routes/studyZoneRoutes'));
app.use('/api/seats', require('./routes/seatRoutes'));
app.use('/api/menu-items', require('./routes/menuItemRoutes'));
app.use('/api/reservations', require('./routes/reservationRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Test Route
app.get('/test', (req, res) => {
res.send('Express is working!');
});

console.log('Study Zone routes loaded');

app.listen(3000, () => console.log('Running at http://localhost:3000'));
app.listen(3000, () => {
console.log('Running at http://localhost:3000');
});
