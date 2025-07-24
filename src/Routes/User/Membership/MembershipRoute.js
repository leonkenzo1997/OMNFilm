const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const membershipController = require('../../../app/Controllers/User/Membership/MembershipController');

// api get detail membership
router.get('/:id', checkAuthorization, membershipController.detail);

// api get list membership
router.get('/', checkAuthorization, membershipController.index);

module.exports = router;
