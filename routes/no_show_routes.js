const express = require('express');
const router = express.Router();

const noShowController = require('../controllers/no_show_controller');

router.post('/release', noShowController.releaseNoShows);

module.exports = router;