const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const images = require('../../../app/Service/Images/ConvertImage');
const constants = require('../../../app/Constant/constants');

// authentication
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.ADMIN, constants.USER_TYPE.SUPPERADMIN])
);

// api create list
router.get('/convertImages', images.convert);

// api run resize image test
router.post('/resizeImages', images.jobsConvert);

module.exports = router;
