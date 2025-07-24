const express = require('express');
const videoManagePolicyRouter = express.Router();

const videoManagePolicyController = require('../../../app/Controllers/User/VideoManagePolicy/VideoManagePolicyController');

// api get detail terms-and-conditions
videoManagePolicyRouter.get('/:id', videoManagePolicyController.detail);

// api get list terms-and-conditions
videoManagePolicyRouter.get('/', videoManagePolicyController.index);

module.exports = videoManagePolicyRouter;
