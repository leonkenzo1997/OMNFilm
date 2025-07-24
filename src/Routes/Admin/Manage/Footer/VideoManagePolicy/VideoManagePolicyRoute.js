const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../../app/Middlewares/Authentication/AuthenticationByRole');
const videoManagePolicyController = require('../../../../../app/Controllers/Admin/Manage/Footer/VideoManagePolicy/VideoManagePolicyController');
const VideoManagePolicyValidation = require('../../../../../app/Middlewares/Validation/VideoManagePolicyValidation');
const constants = require('../../../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create video manage policy
router.post('/create', VideoManagePolicyValidation, videoManagePolicyController.create);

// api get detail video manage policy
router.get('/:id', videoManagePolicyController.detail);

// api update video manage policy
router.put('/:id', VideoManagePolicyValidation, videoManagePolicyController.update);

// api get list video manage policy
router.get('/', videoManagePolicyController.index);

module.exports = router;
