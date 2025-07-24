const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../../app/Middlewares/Authentication/AuthenticationByRole');
const deptController = require('../../../../../app/Controllers/Admin/Manage/Access/DepartmentController');
const deptValidation = require('../../../../../app/Middlewares/Validation/DeptValidation');
const constants = require('../../../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create dept
router.post(
    '/create',
    deptValidation,
    deptController.create,
);

// api get detail dept
router.get('/:id', deptController.detail);

// api update dept
router.put(
    '/:id',
    deptValidation,
    deptController.update,
);

// api delete dept
router.delete('/:id', deptController.destroy);

// api get list dept
router.get('/', deptController.index);

module.exports = router;
