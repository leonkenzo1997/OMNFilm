const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../app/Middlewares/Authentication/AuthenticationByRole');
const constants = require('../../../../app/Constant/constants');
const deactiveController = require('../../../../app/Controllers/Admin/Manage/Deactive/DeactiveController');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api update list survey
router.put('/:id', deactiveController.restore);

// api get list survey
router.get('/', deactiveController.index);

module.exports = router;
