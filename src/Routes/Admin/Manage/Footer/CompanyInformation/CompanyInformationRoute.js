const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../../app/Middlewares/Authentication/AuthenticationByRole');
const companyInformationController = require('../../../../../app/Controllers/Admin/Manage/Footer/CompanyInformation/CompanyInformationController');
const CompanyInformationValidation = require('../../../../../app/Middlewares/Validation/CompanyInformationValidation');
const constants = require('../../../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create company information
router.post('/create', CompanyInformationValidation, companyInformationController.create);

// api get detail company information
router.get('/:id', companyInformationController.detail);

// api update company information
router.put('/:id', CompanyInformationValidation, companyInformationController.update);

// api get list company information
router.get('/', companyInformationController.index);

module.exports = router;
