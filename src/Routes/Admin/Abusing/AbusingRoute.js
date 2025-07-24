const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const abusingController = require('../../../app/Controllers/Admin/Abusing/AbusingManagerController');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const constants = require('../../../app/Constant/constants');

// authentication
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.ADMIN, constants.USER_TYPE.SUPPERADMIN])
);

// api detail user
router.get('/detail/:id', checkAuthorization, abusingController.detail);

// api view history
router.get('/history/:id', checkAuthorization, abusingController.viewHistory);

// api action
router.put('/action/:id', checkAuthorization, abusingController.actionAccount);

// api get list hold account
router.get('/list-hold', checkAuthorization, abusingController.listHold);

// api get list user
router.get('/', checkAuthorization, abusingController.index);

module.exports = router;
