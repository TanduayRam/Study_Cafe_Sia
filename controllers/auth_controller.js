const bcrypt = require('bcryptjs');
const User = require('../models/user_model');

exports.register = async(req, res) => {
    try {
        const { name, email, password, role_id } = req.body;
        const hash = await bcrypt.hash(password, 10);
        const id = await User.create(name, email, hash, role_id || 3);
        res.status(201).json({ id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.login = async(req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ id: user.id, name: user.name, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};