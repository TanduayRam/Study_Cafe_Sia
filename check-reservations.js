const db = require('./config/databases');

async function check() {
    try {
        const [tables] = await db.query(
            "SHOW TABLES LIKE 'reservations'"
        );

        console.log('Reservations table:', tables);
    } catch (error) {
        console.error(error);
    } finally {
        await db.end();
    }
}

check();