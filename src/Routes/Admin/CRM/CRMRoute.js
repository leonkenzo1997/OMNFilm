const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const CRMController = require('../../../app/Controllers/Admin/CRM/CRMController');
const constants = require('../../../app/Constant/constants');
const permissionMenu = require('../../../app/Middlewares/PermissionMenu');

// authentication
router.all(
	'/*',
	checkAuthorization,
	authenticationByRole([constants.USER_TYPE.ADMIN, constants.USER_TYPE.SUPPERADMIN]),
	permissionMenu('CRM')
);

// search customer
router.get('/search-customer', CRMController.searchCustomer);

// detail customer
router.get('/detail-customer/:id', CRMController.detailCustomer);

// list uploads
router.get('/uploads/:id', CRMController.listUploads);

// detail program
router.get('/detail-program/:id', CRMController.detailProgram);

// payment history
router.get('/payment-history/:id', CRMController.paymentHistory);

// list originals
router.get('/originals/:id', CRMController.listOriginals);

// list profit
router.get('/profit/:id', CRMController.listProfit);

// profit revenue user
router.get('/profit-revenue/:id', checkAuthorization, CRMController.revenue);

// list profit year month
router.get('/profit-revenue-year/:id', checkAuthorization, CRMController.profitYearMonth);

//api payment profit
router.get('/payment/:id', checkAuthorization, CRMController.paymentProfit);

//api payment profit follow year month
router.get('/payment-year-month/:id', checkAuthorization, CRMController.paymentYearMonth);

//api status history
router.get('/status-history/:id', checkAuthorization, CRMController.statusHistory);

module.exports = router;
