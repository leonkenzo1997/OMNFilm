const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../app/Middlewares/Authentication/AuthenticationByRole');

const revenusSharingController = require('../../../../app/Controllers/Admin/Manage/RevenusSharing/RevenusSharingController');

const checkPhoneNumber = require('../../../../app/Middlewares/Validation/PhoneNumberValidation');
const revenusSharingValidation = require('../../../../app/Middlewares/Validation/RevenusSharingValidation');

const userValidation = require('../../../../app/Middlewares/Validation/UserValidation');
const constants = require('../../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api detail user
router.get(
    '/detail-user',
    revenusSharingValidation,
    revenusSharingController.profitStatus
);

// api detail user
router.get(
    '/detail-user/export',
    revenusSharingValidation,
    async (request, response, next) => {
        request.exportExcel = true;
        const result = await revenusSharingController.profitStatus(
            request,
            response,
            next
        );

        request.data = result;
        revenusSharingController.exportExcel(request, response, next);
    }
);

// api get list RS
router.get('/rs-user', revenusSharingController.indexRS);

// api update RS
router.put('/rs-user/:id', revenusSharingController.updateRS);

// api update RS
router.put('/:id', revenusSharingValidation, revenusSharingController.update);

// api find user
// router.get(
// 	'/user',
// 	userValidation,
// 	revenusSharingController.findUser
// );

// api get detail RS
router.get('/:id', revenusSharingValidation, revenusSharingController.detail);

// api get list all user
router.get('/', revenusSharingValidation, revenusSharingController.index);

module.exports = router;
