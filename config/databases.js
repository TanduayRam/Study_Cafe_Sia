// This file creates ONE connection to MySQL that every model file shares.
require('dotenv').config({ quiet: true }); // reads the values inside your .env file

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'study_cafe_sia',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',          // 'Z' means we save and read all dates in UTC
    decimalNumbers: true    // money columns come back as real numbers, not text
});

// Every time a new connection opens, tell MySQL to use UTC time too.
pool.pool.on('connection', function (connection) {
    connection.query("SET time_zone = '+00:00'");
});

module.exports = pool;
