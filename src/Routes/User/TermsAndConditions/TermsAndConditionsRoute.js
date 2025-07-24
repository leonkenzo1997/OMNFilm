const express = require('express');
const termsAndConditionsRouter = express.Router();

const termsAndConditionsController = require('../../../app/Controllers/User/TermsAndConditions/TermsAndConditionsController');

// api get detail terms-and-conditions
termsAndConditionsRouter.get('/:id', termsAndConditionsController.detail);

// api get list terms-and-conditions
termsAndConditionsRouter.get('/', termsAndConditionsController.index);

module.exports = termsAndConditionsRouter;
