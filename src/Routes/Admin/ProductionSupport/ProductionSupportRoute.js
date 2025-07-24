const express = require('express');
const router = express.Router();

const productionSupportController = require('../../../app/Controllers/Admin/ProductionSupport/ProductionSupportController');
const constants = require('../../../app/Constant/constants');

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create production support
router.post('/create', productionSupportController.create);

// api get status production support
router.get('/status', productionSupportController.status);

// api get detail production support
router.get('/:id', productionSupportController.detail);

// api update production support
router.put('/:id', productionSupportController.update);

// api get list production support
router.get('/', productionSupportController.index);

module.exports = router;
