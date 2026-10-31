require('dotenv').config();

const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.TIDB_HOST,
    port: Number(process.env.TIDB_PORT || 4000),
    user: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: 'study_cafe_sia',
    ssl: {
        minVersion: 'TLSv1.2'
    }
});

module.exports = db;