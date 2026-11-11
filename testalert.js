const alerts = require('./models/alerts_model');

async function createTestAlert() {
    try {
        const id = await alerts.create(
            1,
            'Test notification',
            'System'
        );

        console.log('Alert created successfully!');
        console.log('New Alert ID:', id);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit();
    }
}

createTestAlert();