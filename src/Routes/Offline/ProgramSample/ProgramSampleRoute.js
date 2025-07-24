const express = require("express");
const router = express.Router();
const checkAuthorization = require("../../../app/Middlewares/Authentication/Authentication");
const programController = require("../../../app/Controllers/Admin/ProgramSample/ProgramSampleController");

// authentication
router.all("/*", checkAuthorization);

router.get("/listProgramSample", programController.find);

module.exports = router;
