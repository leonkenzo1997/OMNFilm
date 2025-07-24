const express = require("express");
const router = express.Router();

const checkAuthorization = require("../../../app/Middlewares/Authentication/Authentication");
const parentProtectionController = require("../../../app/Controllers/Admin/ParentProtection/ParentProtectionController");

// api get all parent protection
router.get("/getAll", checkAuthorization, parentProtectionController.find);

module.exports = router;
