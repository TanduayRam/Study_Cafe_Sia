const express = require('express');
const router = express.Router();

const MemberPassController = require('../controllers/member_pass_controller');

router.post('/', MemberPassController.assignPass);
router.get('/user/:userId', MemberPassController.getByUserId);
router.get('/:id', MemberPassController.getById);

module.exports = router;