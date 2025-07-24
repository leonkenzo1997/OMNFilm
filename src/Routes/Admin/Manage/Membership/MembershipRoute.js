const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../app/Middlewares/Authentication/AuthenticationByRole');
const membershipController = require('../../../../app/Controllers/Admin/Manage/Membership/MembershipController');
const membershipValidation = require('../../../../app/Middlewares/Validation/MembershipValidation');
const constants = require('../../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create membership
router.post('/create', membershipValidation, membershipController.create);

// api get detail membership
router.get('/:id', membershipController.detail);

// api get detail membership
router.put('/:id', membershipValidation, membershipController.update);

// api get list membership
router.get('/', membershipController.index);

module.exports = router;
