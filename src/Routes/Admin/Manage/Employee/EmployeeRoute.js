const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../app/Middlewares/Authentication/AuthenticationByRole');
const employeeController = require('../../../../app/Controllers/Admin/Manage/Employee/EmployeeController');
const manageEmployeeValidation = require('../../../../app/Middlewares/Validation/ManageEmployeeValidation');
const checkEmailExist = require('../../../../app/Middlewares/Validation/CheckEmailExistValidation');

const checkPhoneNumber = require('../../../../app/Middlewares/Validation/PhoneNumberValidation');
const checkPhoneNumberExist = require('../../../../app/Middlewares/Validation/CheckPhoneNumberExistValidation');
const constants = require('../../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create employee
router.post(
    '/create',
    manageEmployeeValidation,
    checkEmailExist,
    checkPhoneNumber,
    checkPhoneNumberExist,
    employeeController.create
);

// api get detail employee
router.get('/:id', employeeController.detail);

// api update employee
router.put('/:id', manageEmployeeValidation, checkPhoneNumber, employeeController.update);

// api get list employee
router.get('/', employeeController.index);

module.exports = router;
