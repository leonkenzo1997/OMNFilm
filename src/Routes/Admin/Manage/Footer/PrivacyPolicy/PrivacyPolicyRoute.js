const express = require('express');
const router = express.Router();

const checkAuthorization = require('../../../../../app/Middlewares/Authentication/Authentication');
const authenticationByRole = require('../../../../../app/Middlewares/Authentication/AuthenticationByRole');
const privacyPolicyController = require('../../../../../app/Controllers/Admin/Manage/Footer/PrivacyPolicy/PrivacyPolicyController');
const PrivacyPolicyValidattion = require('../../../../../app/Middlewares/Validation/PrivacyPolicyValidation');
const constants = require('../../../../../app/Constant/constants');

// authentication role
router.all(
    '/*',
    checkAuthorization,
    authenticationByRole([constants.USER_TYPE.SUPPERADMIN, constants.USER_TYPE.ADMIN])
);

// api create privacy policy
router.post('/create', PrivacyPolicyValidattion, privacyPolicyController.create);

// api get detail privacy policy
router.get('/:id', privacyPolicyController.detail);

// api update privacy policy
router.put('/:id', PrivacyPolicyValidattion, privacyPolicyController.update);

// api get list privacy policy
router.get('/', privacyPolicyController.index);

module.exports = router;
