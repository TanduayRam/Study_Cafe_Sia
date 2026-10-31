const User = require('../models/user_model');

exports.getUsers = async(req, res) => {
    try {
        res.json(await User.getAll());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteUser = async(req, res) => {
    try {
        await User.remove(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};