const seatModel = require('../models/seatModel');

const getAll = async (req, res) => {
    try {
        const seats = await seatModel.getAll();
        res.status(200).json(seats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const seat = await seatModel.getById(req.params.id);

        if (!seat) {
            return res.status(404).json({ message: 'Seat not found' });
        }

        res.status(200).json(seat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const create = async (req, res) => {
    try {
        const { study_zone_id, label, status } = req.body;

        if (!study_zone_id || !label || !label.trim() || !status) {
            return res.status(400).json({
                message: 'Study zone, seat label, and status are required.'
            });
        }

        const result = await seatModel.create(req.body);
        res.status(201).json(result);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                message: 'This seat label already exists in this study zone.'
            });
        }

        res.status(500).json({ message: error.message });
    }
};

const update = async (req, res) => {
    try {
        const existing = await seatModel.getById(req.params.id);

        if (!existing) {
            return res.status(404).json({ message: 'Seat not found' });
        }

        const result = await seatModel.update(req.params.id, req.body);
        res.status(200).json({ message: 'Seat updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const result = await seatModel.remove(req.params.id);

        if (!result) {
            return res.status(404).json({ message: 'Seat not found' });
        }

        res.status(200).json({ message: 'Seat deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove
};