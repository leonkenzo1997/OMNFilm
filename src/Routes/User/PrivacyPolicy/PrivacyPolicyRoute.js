const express = require('express');
const privacyPolicyRouter = express.Router();

const privacyPolicyController = require('../../../app/Controllers/User/PrivacyPolicy/PrivacyPolicyController');

// api get detail privacy-policy
privacyPolicyRouter.get('/:id', privacyPolicyController.detail);

// api get list privacy-policy
privacyPolicyRouter.get('/', privacyPolicyController.index);

module.exports = privacyPolicyRouter;
