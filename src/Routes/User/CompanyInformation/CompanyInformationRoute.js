const express = require('express');
const companyInformationRouter = express.Router();

const companyInformationController = require('../../../app/Controllers/User/CompanyInformation/CompanyInformationController');

// api get detail company-information
companyInformationRouter.get('/:id', companyInformationController.detail);

// api get list company-information
companyInformationRouter.get('/', companyInformationController.index);

module.exports = companyInformationRouter;
