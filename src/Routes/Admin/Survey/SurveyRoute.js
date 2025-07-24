const express = require("express");
const router = express.Router();

const checkAuthorization = require("../../../app/Middlewares/Authentication/Authentication");
const authenticationByRole = require("../../../app/Middlewares/Authentication/AuthenticationByRole");
const surveyController = require("../../../app/Controllers/Admin/Survey/SurveyController");
const constants = require("../../../app/Constant/constants");

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// get survey for admin
router.get("/", surveyController.index);

// // create survey for admin
// router.post("/", surveyController.create);

module.exports = router;
