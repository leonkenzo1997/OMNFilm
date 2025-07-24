const express = require("express");
const router = express.Router();

const checkAuthorization = require("../../../app/Middlewares/Authentication/Authentication");
const authenticationByRole = require("../../../app/Middlewares/Authentication/AuthenticationByRole");
const programEditController = require("../../../app/Controllers/Admin/ProgramEdit/ProgramEditController");
const constants = require("../../../app/Constant/constants");

// authentication
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api approval program edit
router.get("/:status/:id", programEditController.status);

// api get detail program edit
router.get("/:id", programEditController.detail);

// api update program edit
router.put("/:id", programEditController.update);

// api get list program edit
router.get("/", programEditController.index);

module.exports = router;
