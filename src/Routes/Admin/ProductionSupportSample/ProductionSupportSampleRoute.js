const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const productionSupportSampleController = require('../../../app/Controllers/Admin/ProductionSupportSample/ProductionSupportSampleController');
const constants = require('../../../app/Constant/constants');
const productionSupportSampleValidator = require('../../../app/Middlewares/Validation/ProductionSupportSampleValidation');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// todo: create new production support sample
router.post(
    '/create',
    productionSupportSampleValidator.create,
    productionSupportSampleController.create
);

//todo: search production support sample
router.get('/listProductionSupportSample', productionSupportSampleController.find);

// todo: get production support sample by id
router.get('/:id', productionSupportSampleController.getById);

//todo: api update production support sample
router.put(
    '/update',
    //     // programSampleValidator.update,
    productionSupportSampleController.update
);

//todo: ???

module.exports = router;
