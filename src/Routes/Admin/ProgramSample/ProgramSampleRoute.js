const express = require("express");
const router = express.Router();

const checkAuthorization = require("../../../app/Middlewares/Authentication/Authentication");
const authenticationByRole = require("../../../app/Middlewares/Authentication/AuthenticationByRole");
const programSampleController = require("../../../app/Controllers/Admin/ProgramSample/ProgramSampleController");
const constants = require("../../../app/Constant/constants");
const programSampleValidator = require("../../../app/Middlewares/Validation/ProgramSampleValidation");
const programValidation = require('../../../app/Middlewares/Validation/ProgramValidation');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

router.post(
    "/create",
    programSampleValidator.create,
    programSampleController.create
);

//todo: search program, maybe in the future
router.get("/search", programValidation.search, programSampleController.search);

// todo: get program sample by id
router.get("/:id", programSampleController.getById);

//todo: api update program sample
router.put(
    "/update",
    // programSampleValidator.update,
    programSampleController.update
);

//todo: ???

module.exports = router;
