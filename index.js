const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'frontend')));

// Authentication and Membership Routes
app.use('/api/auth', require('./routes/auth_routes'));
app.use('/api/users', require('./routes/user_routes'));
app.use('/api/pass-packages', require('./routes/pass_package_routes'));
app.use('/api/member-passes', require('./routes/member_pass_routes'));
app.use('/api/payments', require('./routes/payment_routes'));
app.use('/api/billing', require('./routes/billing_routes'));
app.use('/api/billing', require('./routes/no_show_routes'));
app.use('/api/reports', require('./routes/member_pass_report_routes'));
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

app.listen(3000, () => {
console.log('Running at http://localhost:3000');
});
