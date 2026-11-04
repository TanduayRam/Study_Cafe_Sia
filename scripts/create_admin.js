require('dotenv').config();

const bcrypt = require('bcryptjs');
const readline = require('readline');
const db = require('../config/databases');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise(resolve => {
        rl.question(question, answer => resolve(answer.trim()));
    });
}

async function createAdmin() {
    try {
        console.log('\n=== STUDY CAFE ADMIN SETUP ===\n');

        const name = await ask('Admin name: ');
        const email = await ask('Admin email: ');
        const password = await ask('Admin password: ');

        if (!name || !email || !password) {
            throw new Error('All fields are required.');
        }

        if (password.length < 8) {
            throw new Error('Password must contain at least 8 characters.');
        }

        const [existing] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            throw new Error('An account with this email already exists.');
        }

        const [roles] = await db.query(
            'SELECT id FROM roles WHERE name = ?',
            ['admin']
        );

        if (roles.length === 0) {
            throw new Error('Admin role was not found in the roles table.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            `INSERT INTO users (name, email, password, role_id)
             VALUES (?, ?, ?, ?)`,
            [name, email, hashedPassword, roles[0].id]
        );

        console.log('\nAdministrator created successfully!');
        console.log('Admin ID:', result.insertId);
        console.log('Email:', email);

    } catch (error) {
        console.error('\nSetup failed:', error.message);
    } finally {
        rl.close();
        await db.end();
    }
}

createAdmin();