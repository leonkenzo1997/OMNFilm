const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../app/Middlewares/Authentication/AuthenticationByRole');
const constants = require('../../../../app/Constant/constants');
const backgroundVideoSettingController = require('../../../../app/Controllers/Admin/Background/Video/BackgroundVideoSettingController');
const backgroundValidation = require('../../../../app/Middlewares/Validation/BackgroundVideoSettingValidation');
const backgroundTimeValidation = require('../../../../app/Middlewares/Validation/BackgroundTimeValidation');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

router.post(
    '/create',
    backgroundValidation.create,
    backgroundTimeValidation,
    backgroundVideoSettingController.create
);

router.put(
    '/update',
    backgroundValidation.update,
    backgroundTimeValidation,
    backgroundVideoSettingController.update
);

// router.get('/list-video', backgroundVideoSettingController.indexDropdownlist);

// router.get('/', backgroundVideoSettingController.index);

module.exports = router;
