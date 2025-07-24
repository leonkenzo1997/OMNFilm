const express = require("express");
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const userManagerController = require('../../../app/Controllers/Admin/UserManager/UserManagementController');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const constants = require('../../../app/Constant/constants');
const permissionMenu = require('../../../app/Middlewares/PermissionMenu');

// authentication
router.all('/*', 
        checkAuthorization, 
        authenticationByRole([constants.USER_TYPE.ADMIN, constants.USER_TYPE.SUPPERADMIN]),
        permissionMenu('CM')
    );

// api get list user
router.get("/refund-list", checkAuthorization, userManagerController.indexRefund);

// api get detail refund
router.get("/refund-detail/:id", checkAuthorization, userManagerController.refundDetail);

// api update refund pg
router.put("/refund-detail/:id", checkAuthorization, userManagerController.updateRefundDetail);

// api get list deactivate
router.get("/deactivate", checkAuthorization, userManagerController.deactivateList);

// api get list deactivate
router.get("/deleted-detail/:id", checkAuthorization, userManagerController.deletedDetail);

// api get list deteled
router.get("/deleted", checkAuthorization, userManagerController.deletedList);

// api deleted account
router.put("/deleted-account/:id", checkAuthorization, userManagerController.deleteAccount);

// api get list deactivate
router.get("/deactivate-detail/:id", checkAuthorization, userManagerController.deactivateDetail);

// api get list feedback
router.get("/feedback", checkAuthorization, userManagerController.feedbackList);

// api get detail feedback
router.get("/feedback-detail/:id", checkAuthorization, userManagerController.feedbackDetail);

// api update feedback
router.put("/update-feedback/:id", checkAuthorization, userManagerController.updateFeedback);

// api sent email user
router.post("/sent-email/:id", checkAuthorization, userManagerController.sentEmail);

// api refunded user
router.put("/refunded", checkAuthorization, userManagerController.refundSelect);

// api view program time
router.get("/view-program/:id", checkAuthorization, userManagerController.viewProgramTime);

// api history user account
router.get("/history-account/:id", checkAuthorization, userManagerController.statusAccount);

module.exports = router;
