require('dotenv').config();

const bcrypt = require('bcryptjs');
const User = require('./models/user_model');
const Role = require('./models/role_model');
const readline = require('readline/promises');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function createAdmin() {
    try {
        console.log('\n=== STUDY CAFE ADMIN ACCOUNT SETUP ===\n');

        const name = (await rl.question('Admin name: ')).trim();
        const email = (await rl.question('Admin email: ')).trim().toLowerCase();
        const password = await rl.question('Admin password: ');

        if (!name || !email || !password) {
            throw new Error('All fields are required.');
        }

        if (password.length < 8) {
            throw new Error('Password must contain at least 8 characters.');
        }

        const existingUser = await User.findByEmail(email);

        if (existingUser) {
            throw new Error('This email is already registered.');
        }

        const adminRole = await Role.getByName('Admin');

        if (!adminRole) {
            throw new Error('Admin role was not found.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await User.create({
            name: name,
            email: email,
            password: hashedPassword,
            role_id: adminRole.role_id
        });

        console.log('\nAdmin account created successfully!');
        console.log('User ID:', admin.user_id);
        console.log('Name:', admin.name);
        console.log('Email:', admin.email);
        console.log('Role:', admin.role);
        console.log('Status: Active');

    } catch (error) {
        console.error('\nFailed to create Admin:', error.message);
    } finally {
        rl.close();
        process.exit();
    }
}

createAdmin();