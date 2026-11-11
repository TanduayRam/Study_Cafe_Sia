
const alerts = require('./models/alerts_model');

async function deleteAlert() {
    try {
        await alerts.remove(1);

        console.log('Alert deleted successfully!');

        const result = await alerts.findById(1);

        console.log('Remaining Alert:', result);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit();
    }
}

deleteAlert();
