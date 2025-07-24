const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../../app/Middlewares/Authentication/AuthenticationByRole');
const teamController = require('../../../../../app/Controllers/Admin/Manage/Access/TeamController');
const teamValidation = require('../../../../../app/Middlewares/Validation/TeamValidation');
const constants = require('../../../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create team
router.post(
    '/create',
    teamValidation,
    teamController.create,
);

// api get detail team
router.get('/:id', teamController.detail);

// api delete team
router.delete('/:id', teamController.destroy);

// api update team
router.put(
    '/:id',
    teamValidation,
    teamController.update,
);

// api get list team
router.get('/', teamController.index);

module.exports = router;
