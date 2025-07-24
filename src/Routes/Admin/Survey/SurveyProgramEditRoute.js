const express = require("express");
const router = express.Router();

const checkAuthorization = require("../../../app/Middlewares/Authentication/Authentication");
const authenticationByRole = require("../../../app/Middlewares/Authentication/AuthenticationByRole");
const surveyProgramEditController = require("../../../app/Controllers/Admin/Survey/SurveyProgramEditController");
const constants = require("../../../app/Constant/constants");
const surveyProgramValidation = require('../../../app/Middlewares/Validation/SurveyProgramValidation')

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// get detail survey program
router.get("/programID/:id", surveyProgramEditController.getSurveyByProgramID);

// get detail survey program
router.get("/:id", surveyProgramEditController.detail);

// get survey program
router.get("/", surveyProgramEditController.index);

// create survey for program
router.post("/",
    surveyProgramValidation.create,
    surveyProgramEditController.create
);

module.exports = router;
