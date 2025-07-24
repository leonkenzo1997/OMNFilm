const express = require("express");
const router = express.Router();
const checkAuthorization = require("../../../app/Middlewares/Authentication/Authentication");
const authenticationByRole = require("../../../app/Middlewares/Authentication/AuthenticationByRole");
const programOriginalController = require("../../../app/Controllers/Admin/ProgramOriginal/ProgramOriginalController");
const constants = require("../../../app/Constant/constants");
const programOriginalValidator = require("../../../app/Middlewares/Validation/ProgramOriginalValidation");
const permissionMenu = require('../../../app/Middlewares/PermissionMenu');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.ADMIN, constants.USER_TYPE.SUPPERADMIN]),
    permissionMenu('OG')
);

// api create program
router.post("/create",
    programOriginalController.create
);

// Change status
router.put("/status/:id",
    programOriginalValidator.changeStatus,
    programOriginalController.changeStatus
);

// Update participants original
router.put("/update-participants/:id",
    programOriginalController.updateParticipants
);

// Update original
router.put("/:id",
    programOriginalController.update
);

// Get list upload original
router.get("/", programOriginalController.index);

// Get original crack in list
router.get("/crack-in", programOriginalController.crackInLists);

// Get original cancel list
router.get("/cancel", programOriginalController.cancelLists);

router.get("/search", programOriginalController.search);

router.get("/getById", programOriginalController.getById);

// Get participant rates
router.get("/participants-rates/:id", programOriginalController.getParticipantRates);

// find user by email
router.get("/find-users", programOriginalController.findUsers);

//get newest contents this week
router.get("/thisweek", programOriginalController.newestThisWeek);

//get newest contents next week
router.get("/nextweek", programOriginalController.newestNextWeek);

// //get newest list
// router.get("/newest-list", programOriginalController.newestList);

// //get confirm reveal date
// router.get("/reveal-date", programOriginalController.revealDate);

module.exports = router;
