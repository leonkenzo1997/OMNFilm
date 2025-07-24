const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const constants = require('../../../app/Constant/constants');
const backgroundController = require('../../../app/Controllers/Online/Background/BackgroundVideoController');

// authentication
router.all('/*', checkAuthorization);

router.get('/', backgroundController.index);

module.exports = router;
