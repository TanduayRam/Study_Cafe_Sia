const logAction = require('./utils/audit_logger');

async function test() {
    try {
        const id = await logAction({
            userId: 7,
            action: 'TEST',
            tableName: 'audit_logs',
            recordId: null,
            description: 'Testing the shared audit logger.'
        });

        console.log('Audit log created successfully. ID:', id);
    } catch (error) {
        console.error('Test failed:', error.message);
    } finally {
        process.exit();
    }
}

test();