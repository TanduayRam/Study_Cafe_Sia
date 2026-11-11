
const express = require('express');
const router = express.Router();

const engineController = require('../controllers/engine_controller');

router.post('/check', engineController.check);

module.exports = router;
