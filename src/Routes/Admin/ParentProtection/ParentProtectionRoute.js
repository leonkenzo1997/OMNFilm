const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const parentProtectionController = require('../../../app/Controllers/Admin/ParentProtection/ParentProtectionController');
const constants = require('../../../app/Constant/constants');
const parentProtectionValidator = require('../../../app/Middlewares/Validation/ParentProtectionValidation');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// todo: create
router.post(
    '/create',
    parentProtectionValidator.create,
    parentProtectionController.create
);

// todo: api update
router.put(
    '/update',
    parentProtectionValidator.update,
    parentProtectionController.update
);

router.get('/getAll', parentProtectionController.find);

//todo: ???

module.exports = router;
