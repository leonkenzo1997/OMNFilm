const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../../app/Middlewares/Authentication/AuthenticationByRole');
const termsAndConditionsController = require('../../../../../app/Controllers/Admin/Manage/Footer/TermsAndConditions/TermsAndConditionsController');
const TermsAndConditionsValidation = require('../../../../../app/Middlewares/Validation/TermsAndConditionsValidation');
const constants = require('../../../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create term and conditions
router.post('/create', TermsAndConditionsValidation, termsAndConditionsController.create);

// api get detail term and conditions
router.get('/:id', termsAndConditionsController.detail);

// api update term and conditions
router.put('/:id', TermsAndConditionsValidation, termsAndConditionsController.update);

// api get list term and conditions
router.get('/', termsAndConditionsController.index);

module.exports = router;
