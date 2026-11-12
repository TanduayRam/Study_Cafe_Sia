const sessionLogs = require('./models/session_logs_model');
const alerts = require('./models/alerts_model');
const auditLogs = require('./models/audit_logs_model');

async function testModels() {
    try {
        console.log('Testing Session Logs Model...');
        console.log(await sessionLogs.getAll());

        console.log('Testing Alerts Model...');
        console.log(await alerts.getAll());

        console.log('Testing Audit Logs Model...');
        console.log(await auditLogs.getAll());

        console.log('All Models tested successfully!');
    } catch (error) {
        console.error('Model test failed:', error.message);
    } finally {
        process.exit();
    }
}

testModels();
