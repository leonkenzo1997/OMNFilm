const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../app/Middlewares/Authentication/AuthenticationByRole');
const constants = require('../../../../app/Constant/constants');
const surveyController = require('../../../../app/Controllers/Admin/Manage/Survey/SurveyController');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api update list survey
router.put('/update-image/:id', surveyController.updateImageSurvey);

// api update list survey
router.put('/update/:id', surveyController.updateSurvey);

// api get list survey
router.get('/list-not-survey', surveyController.listNotSurvey);

// api get list survey
router.get('/', surveyController.index);
module.exports = router;
