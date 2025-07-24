const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const constants = require('../../../app/Constant/constants');
const backgroundController = require('../../../app/Controllers/Online/Background/BackgroundPosterController');

// authentication
router.all('/*', checkAuthorization, authenticationByRole(Object.values(constants.USER_TYPE)));

router.get('/', backgroundController.index);

module.exports = router;
