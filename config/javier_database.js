const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'study_cafe_app',
    password: 'ChooseANewPassword123!',
    database: 'study_cafe_sia',
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = db;