require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const path = require('path');

const db = require('./config/databases');
const { sendSuccess } = require('./utils/http');
const { notFound, errorHandler } = require('./middleware/error_handler');

const app = express();

app.use(cors());           // allows the browser to call our API
app.use(express.json());   // lets us read JSON sent in the request body

// The frontend (HTML, CSS, JS files) is served from the "frontend" folder.
app.use(express.static(path.join(__dirname, 'frontend')));
app.get('/', function (req, res) {
    res.redirect('/login.html');
});

// ----------------------------------------------------------------
// REST API: every address starts with /api/v1
// Add one line here for every new route file.
// ----------------------------------------------------------------
const api = express.Router();

// A quick test that the server and the database are working.
api.get('/health', async function (req, res, next) {
    try {
        const [rows] = await db.query('SELECT DATABASE() AS database_name');
        sendSuccess(res, { database: rows[0].database_name }, 'Server and database are running.');
    } catch (error) {
        next(error);
    }
});

// Core
api.use('/auth', require('./routes/auth_routes'));
api.use('/users', require('./routes/user_routes'));
api.use('/roles', require('./routes/role_routes'));

// Master data
api.use('/study-zones', require('./routes/studyZoneRoutes'));
api.use('/seats', require('./routes/seatRoutes'));
api.use('/menu-items', require('./routes/menuItemRoutes'));

// Transactions
api.use('/reservations', require('./routes/reservationRoutes'));
api.use('/orders', require('./routes/orderRoutes'));
api.use('/order-items', require('./routes/orderItemRoutes'));

// Rules: passes, payments, billing
api.use('/pass-packages', require('./routes/pass_package_routes'));
api.use('/member-passes', require('./routes/member_pass_routes'));
api.use('/payments', require('./routes/payment_routes'));
api.use('/billing', require('./routes/billing_routes'));

// Workflow: sessions, alerts, audit log, engine
api.use('/session-logs', require('./routes/session_logs_routes'));
api.use('/alerts', require('./routes/alerts_routes'));
api.use('/audit-logs', require('./routes/audit_logs_routes'));
api.use('/engine', require('./routes/engine_routes'));

// Reviews, snapshots, dashboard and the six join reports
api.use('/reviews', require('./routes/feedback_review_routes'));
api.use('/report-snapshots', require('./routes/report_snapshot_routes'));
api.use('/dashboard', require('./routes/dashboard_routes'));
api.use('/reports', require('./routes/report_routes'));

app.use('/api/v1', api);

// An /api address that does not exist -> 404. Then every error goes to errorHandler.
app.use('/api', notFound);
app.use(errorHandler);

// ----------------------------------------------------------------
// Optional automatic engine. Turn it on with ENGINE_AUTO=true in .env.
// Every few seconds it releases no-shows and runs the alert checks.
// ----------------------------------------------------------------
function startEngineTimer() {
    if (String(process.env.ENGINE_AUTO).toLowerCase() !== 'true') {
        return;
    }

    const seconds = Number(process.env.ENGINE_INTERVAL_SECONDS || 60);
    const noShows = require('./models/no_show_model');
    const engine = require('./models/engine_model');

    setInterval(async function () {
        try {
            const released = await noShows.releaseNoShows(new Date());
            const checks = await engine.checkSessions(new Date());

            if (released.length > 0 || checks.created_alert_ids.length > 0) {
                console.log('Engine: released ' + released.length + ' no-show(s), created ' +
                    checks.created_alert_ids.length + ' alert(s).');
            }
        } catch (error) {
            console.error('Engine timer error:', error.message);
        }
    }, seconds * 1000);

    console.log('Automatic engine is ON (every ' + seconds + ' seconds).');
}

const PORT = Number(process.env.PORT || 3000);

// Only start the server when this file is run directly (npm start).
if (require.main === module) {
    app.listen(PORT, function () {
        console.log('Study Cafe server running at http://localhost:' + PORT);
        startEngineTimer();
    });
}

module.exports = app;
