
const engineModel = require('../models/engine_model');

exports.check = async (req, res) => {
    try {
        const result = await engineModel.checkSessions();

        res.status(200).json(result);

    } catch (error) {
        console.error('Engine Error:', error);

        res.status(500).json({
            success: false,
            message: 'Monitoring engine failed.',
            error: error.message
        });
    }
};
