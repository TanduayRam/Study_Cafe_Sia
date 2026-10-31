const db = require('../config/databases');

exports.getAll = async() => {
    const [rows] = await db.query('SELECT * FROM roles');
    return rows;
};