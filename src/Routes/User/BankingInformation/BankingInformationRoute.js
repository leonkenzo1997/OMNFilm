const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const bankingInformationController = require('../../../app/Controllers/User/BankingInformation/BankingInformationController');
const bankingInformationValidation = require('../../../app/Middlewares/Validation/BankingInformationValidation');

// api get all parent protection
router.put('/update', checkAuthorization, bankingInformationValidation.update, bankingInformationController.update);

module.exports = router;
