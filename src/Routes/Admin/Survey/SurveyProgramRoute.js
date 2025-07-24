const express = require("express");
const router = express.Router();

const checkAuthorization = require("../../../app/Middlewares/Authentication/Authentication");
const authenticationByRole = require("../../../app/Middlewares/Authentication/AuthenticationByRole");
const surveyProgramController = require("../../../app/Controllers/Admin/Survey/SurveyProgramController");
const constants = require("../../../app/Constant/constants");
const surveyProgramValidation = require('../../../app/Middlewares/Validation/SurveyProgramValidation')

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// get detail survey program
router.get("/programID/:id", surveyProgramController.getSurveyByProgramID);

// get detail survey program
router.get("/:id", surveyProgramController.detail);

// get survey program
router.get("/", surveyProgramController.index);

// create survey for program
router.post("/",
    surveyProgramValidation.create,
    surveyProgramController.create
);

module.exports = router;
