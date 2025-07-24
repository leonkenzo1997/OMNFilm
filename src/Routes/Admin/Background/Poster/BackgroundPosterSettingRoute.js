const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../app/Middlewares/Authentication/AuthenticationByRole');
const constants = require('../../../../app/Constant/constants');
const backgroundPosterSettingController = require('../../../../app/Controllers/Admin/Background/Poster/BackgroundPosterSettingController');
const backgroundPosterSettingValidation = require('../../../../app/Middlewares/Validation/BackgroundPosterSettingValidation');
// const backgroundTimeValidation = require('../../../../app/Middlewares/Validation/BackgroundTimeValidation');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// router.post(
//     '/create',
//     backgroundPosterSettingValidation.create,
//     backgroundPosterSettingController.create

router.get('/search', backgroundPosterSettingController.searchProgram);

router.put(
    '/:id',
    backgroundPosterSettingValidation.update,
    backgroundPosterSettingController.update
);

// router.delete('/:id', backgroundPosterSettingController.destroy);

router.get('/:id', backgroundPosterSettingController.detail);

router.get('/', backgroundPosterSettingController.index);

module.exports = router;
