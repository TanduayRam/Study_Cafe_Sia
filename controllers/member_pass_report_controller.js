const memberPassReportModel = require('../models/member_pass_report_model');

// Get the member passes report
async function getAll(req, res) {
    try {
        const memberPasses = await memberPassReportModel.getAll();

        return res.status(200).json({
            success: true,
            count: memberPasses.length,
            data: memberPasses
        });

    } catch (error) {
        console.error('Member pass report error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve member passes report.'
        });
    }
}

module.exports = {
    getAll
 };