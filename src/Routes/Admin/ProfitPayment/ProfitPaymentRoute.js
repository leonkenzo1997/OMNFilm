const express = require("express");
const router = express.Router();

const checkAuthorization = require("../../../app/Middlewares/Authentication/Authentication");
const authenticationByRole = require("../../../app/Middlewares/Authentication/AuthenticationByRole");
const ProfitPaymentController = require("../../../app/Controllers/Admin/ProfitPayment/ProfitPaymentController");
const constants = require("../../../app/Constant/constants");

// authentication
router.all(
    "/*",
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.ADMIN, constants.USER_TYPE.SUPPERADMIN])
);

// api export excel profit payment
router.get("/export", async (request, response, next) => {
    request.exportExcel = true
    const result = await ProfitPaymentController.index(request, response, next)

    request.data = result.docs
    ProfitPaymentController.exportExcel(request, response, next)
});

// aip get profit payment detail
router.get("/:id", ProfitPaymentController.detail);

// api get profit payment
router.get("/", ProfitPaymentController.index);

module.exports = router;
