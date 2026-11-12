const alerts = require('./models/alerts_model');

async function getAlerts() {
    try {
        const result = await alerts.getAll();

        console.log('Alerts retrieved successfully!');
        console.log(result);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit();
    }
}

getAlerts();