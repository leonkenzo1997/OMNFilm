const express = require('express');
const router = express.Router();
const checkAuthorization = require('../../../app/Middlewares/Authentication/Authentication');

const categoryManageController = require('../../../app/Controllers/Offline/CategoryManage/CategoryManageController');

// api get detail category manage  
router.get('/:id', checkAuthorization, categoryManageController.detail);

// api get list category manage 
router.get('/', checkAuthorization, categoryManageController.index);

module.exports = router;
