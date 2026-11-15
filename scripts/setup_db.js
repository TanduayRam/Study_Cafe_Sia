// One command to (re)build the database:   npm run setup-db
// It runs databases/schema.sql and then databases/seed.sql using the values in .env.
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true    // lets us run a whole .sql file at once
    });

    const files = ['schema.sql', 'seed.sql'];

    for (let i = 0; i < files.length; i++) {
        const sql = fs.readFileSync(path.join(__dirname, '..', 'databases', files[i]), 'utf8');
        console.log('Running ' + files[i] + ' ...');
        await connection.query(sql);
    }

    await connection.end();
    console.log('Database is ready. Demo logins are listed at the top of databases/seed.sql.');
}

main().catch(function (error) {
    console.error('Setup failed:', error.message);
    process.exit(1);
});
