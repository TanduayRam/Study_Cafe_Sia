
const alerts = require('./models/alerts_model');

async function markAlertRead() {
    try {
        await alerts.markAsRead(1);

        console.log('Alert marked as read successfully!');

        const result = await alerts.findById(1);

        console.log('Updated Alert:');
        console.log(result);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit();
    }
}

markAlertRead();
