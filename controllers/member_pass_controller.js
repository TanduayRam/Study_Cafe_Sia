const MemberPass = require('../models/member_pass_model');

// POST: Assign a pass package to a member
exports.assignPass = async (req, res) => {
    try {
        const userId = Number(req.body.user_id);
        const packageId = Number(req.body.pass_package_id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required.'
            });
        }

        if (!Number.isInteger(packageId) || packageId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid pass package ID is required.'
            });
        }

        const memberPass = await MemberPass.assignPass(userId, packageId);

        res.status(201).json({
            success: true,
            message: 'Pass assigned successfully.',
            data: memberPass
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to assign pass.'
        });
    }
};

// GET: Retrieve one member pass
exports.getById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid member pass ID.'
            });
        }

        const memberPass = await MemberPass.getById(id);

        if (!memberPass) {
            return res.status(404).json({
                success: false,
                message: 'Member pass not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: memberPass
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve member pass.'
        });
    }
};

// GET: Retrieve all passes belonging to a member
exports.getByUserId = async (req, res) => {
    try {
        const userId = Number(req.params.userId);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID.'
            });
        }

        const memberPasses = await MemberPass.getByUserId(userId);

        res.status(200).json({
            success: true,
            data: memberPasses
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve member passes.'
        });
    }
};