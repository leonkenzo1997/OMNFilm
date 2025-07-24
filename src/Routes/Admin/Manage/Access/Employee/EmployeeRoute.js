const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../../app/Middlewares/Authentication/AuthenticationByRole');
const employeeController = require('../../../../../app/Controllers/Admin/Manage/Access/EmployeeController');
const employeeValidation = require('../../../../../app/Middlewares/Validation/EmployeeValidation');
const constants = require('../../../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create employee
router.post(
    '/create',
    employeeValidation,
    employeeController.create,
);

// api get detail employee
router.get('/:id', employeeController.detail);

// api delete employee
router.delete('/:id', employeeController.destroy);

// api update employee
router.put(
    '/:id',
    employeeValidation,
    employeeController.update,
);

// api get list employee
router.get('/', employeeController.index);

module.exports = router;
