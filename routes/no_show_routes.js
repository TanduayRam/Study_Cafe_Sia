const express = require('express');
const router = express.Router();

const noShowController = require('../controllers/no_show_controller');

// Release reservations that were not checked in within 15 minutes.
router.post('/release-no-shows', noShowController.releaseNoShows);

module.exports = router;
