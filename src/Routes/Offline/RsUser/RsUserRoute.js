const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const validation = require('../../../app/Middlewares/Validation/ChallengerValidation');
const rsUserController = require('../../../app/Controllers/Offline/RsUser/RsUserController');
const revenusSharingController = require('../../../app/Controllers/Admin/Manage/RevenusSharing/RevenusSharingController')

// api get list revenue rs user
router.get('/revenue', checkAuthorization, rsUserController.revenue);

//api get list payment rs user
// router.get('/payment', checkAuthorization, rsUserController.payment);

//api get list rs user follow year
router.get('/list-year', checkAuthorization, rsUserController.listYear);

//api export list rs user follow year
router.get('/list-year/export', checkAuthorization, async (request, response, next) => {
    request.exportExcel = true
    const result = await rsUserController.listYear(request, response, next)

    request.data = result
	revenusSharingController.exportExcel(request, response, next)
});

//api request profit rs user
router.put('/request-profit', checkAuthorization, rsUserController.requestProfit);

//api profit rs user
router.get('/profit', checkAuthorization, rsUserController.profit);

//api profit rs user follow month
router.get('/profit-month', checkAuthorization, rsUserController.profitFollowMonth);

//api profit zendesk
router.get('/profit-zendesk', rsUserController.infoZendesk);

//api get endcode
router.get('/encode-zendesk', rsUserController.encodeZendesk);

//api get profit user
router.get('/profit-user', checkAuthorization, rsUserController.profitUser);

//api get list request user
router.get('/request-user', checkAuthorization, rsUserController.listRequestUser);

//api accept request user
router.put('/accept-request/:id', checkAuthorization, rsUserController.acceptRequest);

//api payment profit
router.get('/payment', checkAuthorization, rsUserController.paymentProfit);

//api payment profit follow year month
router.get('/payment-year-month', checkAuthorization, rsUserController.paymentYearMonth);

// //api get message user offline
// router.get('/get-message', checkAuthorization, rsUserController.getMessage);

module.exports = router;
