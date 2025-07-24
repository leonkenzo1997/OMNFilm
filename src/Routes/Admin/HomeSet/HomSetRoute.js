const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../app/Middlewares/Authentication/AuthenticationByRole');
const homeSetController = require('../../../app/Controllers/Admin/HomeSet/HomeSetController');
const homeSetValidation = require('../../../app/Middlewares/Validation/HomeSetValidation');
const constants = require('../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create homeset
router.post(
    '/create',
    homeSetValidation,
    homeSetController.create,
);

// api get detail homeset
router.get('/:id', homeSetController.detail);

// api get detail homeset
router.put(
    '/:id',
    homeSetValidation,
    homeSetController.update,
);

// api delete homeset
router.delete('/:id', homeSetController.destroy);

// api get list homeset
router.get('/', homeSetController.index);

module.exports = router;
